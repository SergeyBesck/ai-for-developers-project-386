<?php

declare(strict_types=1);

namespace App;

use DateTimeImmutable;
use DateTimeInterface;
use PDO;
use PDOException;

/**
 * Хранилище записей и их ячеек в SQLite.
 *
 * Создание записи и вставка всех её ячеек идут одной транзакцией: при пересечении
 * (проверка занятости внутри транзакции либо уникальный индекс ячеек) откатывается
 * всё целиком — ни одной ячейки отклонённой записи в базе не остаётся.
 */
final class BookingRepository
{
    public function __construct(
        private readonly Database $database,
        private readonly Clock $clock,
    ) {
    }

    /**
     * @throws SlotConflictException хотя одна ячейка выбранного времени уже занята
     */
    public function create(
        string $id,
        string $eventTypeId,
        DateTimeImmutable $start,
        int $durationMinutes,
        string $name,
        string $email,
        ?string $note,
    ): void {
        $cells = SlotGrid::cells($start, $durationMinutes);
        $pdo = $this->database->pdo();

        $pdo->beginTransaction();

        try {
            $occupied = $this->occupiedCells($cells);

            if ($occupied !== []) {
                throw new SlotConflictException($occupied);
            }

            $this->insertBooking($id, $eventTypeId, $start, $name, $email, $note);
            $this->insertCells($id, $cells);
            $pdo->commit();
        } catch (SlotConflictException $exception) {
            $pdo->rollBack();

            throw $exception;
        } catch (PDOException $exception) {
            $pdo->rollBack();

            $errorInfo = $exception->errorInfo;

            // Уникальный индекс booking_cells_cell_unique: параллельная запись успела занять ячейку.
            if (is_array($errorInfo) && ($errorInfo[0] ?? null) === '23000') {
                throw new SlotConflictException([]);
            }

            throw $exception;
        }
    }

    /**
     * Интервалы всех записей для расчёта занятости: начало из хранилища плюс длительность типа события.
     *
     * @return list<array{start: DateTimeImmutable, durationMinutes: int}>
     */
    public function allIntervals(): array
    {
        $statement = $this->database->pdo()->prepare(
            'SELECT bookings.start AS start, event_types.duration_minutes AS duration_minutes
             FROM bookings
             JOIN event_types ON event_types.id = bookings.event_type_id
             ORDER BY bookings.start',
        );
        $statement->execute();
        $rows = $statement->fetchAll();

        $intervals = [];
        foreach ($rows as $row) {
            $intervals[] = [
                'start' => new DateTimeImmutable((string) $row['start']),
                'durationMinutes' => (int) $row['duration_minutes'],
            ];
        }

        return $intervals;
    }

    /**
     * Занятые ячейки из переданного набора (Unix-секунды начала ячеек).
     *
     * @param list<int> $cells
     *
     * @return list<int>
     */
    private function occupiedCells(array $cells): array
    {
        $placeholders = implode(', ', array_fill(0, count($cells), '?'));
        $statement = $this->database->pdo()->prepare(
            sprintf('SELECT cell FROM booking_cells WHERE cell IN (%s) ORDER BY cell', $placeholders),
        );
        $statement->execute($cells);

        $occupied = [];
        foreach ($statement->fetchAll() as $row) {
            $occupied[] = (int) $row['cell'];
        }

        return $occupied;
    }

    private function insertBooking(
        string $id,
        string $eventTypeId,
        DateTimeImmutable $start,
        string $name,
        string $email,
        ?string $note,
    ): void {
        $statement = $this->database->pdo()->prepare(
            'INSERT INTO bookings (id, event_type_id, start, name, email, note, created_at)
             VALUES (:id, :eventTypeId, :start, :name, :email, :note, :createdAt)',
        );

        $statement->bindValue(':id', $id);
        $statement->bindValue(':eventTypeId', $eventTypeId);
        $statement->bindValue(':start', $start->format(DateTimeInterface::ATOM));
        $statement->bindValue(':name', $name);
        $statement->bindValue(':email', $email);
        $statement->bindValue(':note', $note);
        $statement->bindValue(':createdAt', $this->clock->now()->format(DateTimeInterface::ATOM));
        $statement->execute();
    }

    /** @param list<int> $cells */
    private function insertCells(string $bookingId, array $cells): void
    {
        $statement = $this->database->pdo()->prepare(
            'INSERT INTO booking_cells (booking_id, cell) VALUES (:bookingId, :cell)',
        );

        foreach ($cells as $cell) {
            $statement->bindValue(':bookingId', $bookingId);
            $statement->bindValue(':cell', $cell, PDO::PARAM_INT);
            $statement->execute();
        }
    }
}
