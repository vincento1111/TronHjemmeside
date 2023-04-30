import { IUser } from "./IUser";

export interface IUserChat {
    messageId?: number;
    userId: number;
    User?: IUser;
    content: string;
    timeStamp?: any;
    
  }
  