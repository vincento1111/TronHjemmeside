export type StatName = 'strength' | 'defense' | 'speed' | 'dexterity';

export interface Stats {
  strength: number; defense: number; speed: number; dexterity: number;
  energy: number; maxEnergy: number; nextEnergyAt: string | null;
  money: number; level: number; health: number; maxHealth: number;
}
export interface Me {
  id: number; displayName: string; email: string; description: string;
  createdAt: string; stats: Stats;
}
export interface Player {
  id: number; displayName: string; description: string; createdAt: string; level: number;
}
export interface Definition {
  id: number; name: string; description: string; kind: 'weapon' | 'consumable';
  tracking: 'instance' | 'stack'; price: number; basePower: number; energyRestore: number;
}
export interface ItemInstance {
  id: number; definitionId: number; name: string; definitionName: string; power: number; equipped: boolean;
}
export interface ItemStack { definitionId: number; name: string; quantity: number; energyRestore: number; }
export interface Inventory { instances: ItemInstance[]; stacks: ItemStack[]; }
export interface Message {
  id: number; senderId: number; senderName: string; recipientId: number | null;
  content: string; createdAt: string; clientMessageId: string;
}
export interface MessagePage { messages: Message[]; cursor: number; hasMore: boolean; }
export interface OutgoingMessage {
  clientMessageId: string; content: string; recipientId: number | null;
  status: 'sending' | 'failed'; error?: string;
}
export const STAT_INFO: { name: StatName; label: string; icon: string; description: string }[] = [
  { name: 'strength', label: 'Strength', icon: '↗', description: 'Build the force behind your next move.' },
  { name: 'defense', label: 'Defense', icon: '◇', description: 'Hold your ground when the city pushes back.' },
  { name: 'speed', label: 'Speed', icon: 'ϟ', description: 'Stay one step ahead of the competition.' },
  { name: 'dexterity', label: 'Dexterity', icon: '⌁', description: 'Make every movement count.' },
];
