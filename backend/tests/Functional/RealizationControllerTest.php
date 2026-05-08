<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use PHPUnit\Framework\Attributes\Test;

final class RealizationControllerTest extends ApiTestCase
{
    #[Test]
    public function list_is_public_and_returns_realizations(): void
    {
        $this->client->request('GET', '/api/realizations');

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertGreaterThan(0, count($data));

        $first = $data[array_key_first($data)];
        self::assertArrayHasKey('id', $first);
        self::assertArrayHasKey('type', $first);
        self::assertArrayHasKey('equipmentType', $first);
        self::assertArrayHasKey('region', $first);
    }

    #[Test]
    public function list_with_equipment_filter_only_returns_matching(): void
    {
        $this->client->request('GET', '/api/realizations?equipmentType=HEAT_PUMP');

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertGreaterThan(0, count($data));
        foreach ($data as $row) {
            self::assertSame('HEAT_PUMP', $row['equipmentType']);
        }
    }
}
