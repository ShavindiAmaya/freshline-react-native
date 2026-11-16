/**
 * FreshLine Shared Waste Types
 * Used by Member E for food outcomes and insights.
 */

export type FoodOutcome = 'Consumed' | 'Wasted';

export interface WasteRecord {
    id: string;
    userId: string;
    foodItemId: string | null;
    foodName: string;
    category: string;
    outcome: FoodOutcome;
    quantity: number;
    unit: string;
    recordedAt: string;
}