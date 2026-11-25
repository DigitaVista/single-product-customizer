<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

final class CapabilityRegistry
{
    /** @var array<string, callable(): array> */
    private array $products = [];

    public function register(string $productId, callable $read): void
    {
        if (isset($this->products[$productId])) {
            throw new \LogicException('duplicate_product');
        }

        $this->products[$productId] = $read;
    }

    public function all(): array
    {
        $products = $this->products;
        ksort($products);
        $capabilities = [];
        foreach ($products as $productId => $read) {
            $capabilities[$productId] = $read();
        }

        return $capabilities;
    }
}
