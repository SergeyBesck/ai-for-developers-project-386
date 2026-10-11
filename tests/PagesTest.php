<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class PagesTest extends TestCase
{
    private static function page(string $file): string
    {
        $path = dirname(__DIR__) . '/public/' . $file;
        self::assertFileExists($path);

        $content = file_get_contents($path);
        self::assertIsString($content);

        return $content;
    }

    public function testHomePageFollowsTheReference(): void
    {
        $html = self::page('index.html');

        self::assertStringContainsString('<html lang="ru">', $html);
        self::assertStringContainsString('<title>Calendar', $html);
        self::assertStringContainsString('<h1>Calendar</h1>', $html);
        self::assertStringContainsString('Быстрая запись на звонок', $html);
        self::assertStringContainsString(
            'Забронируйте встречу за минуту: выберите тип события и удобное время.',
            $html,
        );
        self::assertStringContainsString('Возможности', $html);
        self::assertStringContainsString(
            'Выбор типа события и удобного времени для встречи.',
            $html,
        );
        self::assertStringContainsString(
            'Быстрое бронирование с подтверждением и дополнительными заметками.',
            $html,
        );
        self::assertStringContainsString(
            'Управление типами встреч и просмотр предстоящих записей в админке.',
            $html,
        );
    }

    public function testHomePageLeadsToBookingPage(): void
    {
        $html = self::page('index.html');

        self::assertStringContainsString('href="booking.html"', $html);
        self::assertStringContainsString('Записаться', $html);
    }

    public function testHomePageHasNoHealthCheckWidget(): void
    {
        self::assertStringNotContainsString('id="status"', self::page('index.html'));
        self::assertStringNotContainsString('app.js', self::page('index.html'));
    }

    public function testBookingPageIsAWorkingStub(): void
    {
        $html = self::page('booking.html');

        self::assertStringContainsString('<html lang="ru">', $html);
        self::assertStringContainsString('href="index.html"', $html);
        self::assertStringContainsString('На главную', $html);
        self::assertStringContainsString('Выберите тип события', $html);
        self::assertStringContainsString(
            'Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.',
            $html,
        );
        self::assertStringContainsString('Tota', $html);
        self::assertStringContainsString('>Host<', $html);
    }

    public function testBookingPageListsEventTypes(): void
    {
        $html = self::page('booking.html');

        self::assertStringContainsString('Встреча 15 минут', $html);
        self::assertStringContainsString('15 мин', $html);
        self::assertStringContainsString('Короткий тип события для быстрого слота.', $html);
        self::assertStringContainsString('Встреча 30 минут', $html);
        self::assertStringContainsString('30 мин', $html);
        self::assertStringContainsString('Базовый тип события для бронирования.', $html);
    }

    public function testEventTypeCardsAreNotLinks(): void
    {
        $html = self::page('booking.html');

        self::assertStringNotContainsString('<a class="card type-card"', $html);
        self::assertStringNotContainsString('<a class="type-card"', $html);
    }
}
