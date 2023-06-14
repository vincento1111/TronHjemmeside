import { IUser } from "./IUser";
import { Items } from "./Items";

export interface Inventory{
    inventoryId?:number;
    userId?:number;
    User?:IUser;
    itemId?:number;
    Item?:Items;

}