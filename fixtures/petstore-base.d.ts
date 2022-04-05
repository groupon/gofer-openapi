import Gofer from "gofer";
export declare type Order = {
    id?: number;
    petId?: number;
    quantity?: number;
    shipDate?: string;
    status?: "placed" | "approved" | "delivered";
    complete?: boolean;
};
export declare type Customer = {
    id?: number;
    username?: string;
    address?: Address[];
};
export declare type Address = {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
};
export declare type Category = {
    id?: number;
    name?: string;
};
export declare type User = {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    userStatus?: number;
};
export declare type Tag = {
    id?: number;
    name?: string;
};
export declare type Pet = {
    id?: number;
    name: string;
    category?: Category;
    photoUrls: string[];
    tags?: Tag[];
    status?: "available" | "pending" | "sold";
};
export declare type ApiResponse = {
    code?: number;
    type?: string;
    message?: string;
};
export declare class PetStoreBase extends Gofer {
    addPet(pet: Pet): Promise<Pet>;
    updatePet(pet: Pet): Promise<Pet>;
    findPetsByStatus(opts?: {
        status?: "available" | "pending" | "sold";
    }): Promise<Pet[]>;
    findPetsByTags(opts?: {
        tags?: string[];
    }): Promise<Pet[]>;
    getPetById(opts: {
        petId: number;
    }): Promise<Pet>;
    updatePetWithForm(opts: {
        petId: number;
        name?: string;
        status?: string;
    }): Promise<void>;
    deletePet(opts: {
        apiKey?: string;
        petId: number;
    }): Promise<void>;
    uploadFile(opts: {
        petId: number;
        additionalMetadata?: string;
        body?: string;
    }): Promise<ApiResponse>;
    getInventory(): Promise<Record<string, number>>;
    placeOrder(order?: Order): Promise<Order>;
    getOrderById(opts: {
        orderId: number;
    }): Promise<Order>;
    deleteOrder(opts: {
        orderId: number;
    }): Promise<void>;
    createUser(user?: User): Promise<void>;
    createUsersWithListInput(users?: User[]): Promise<User>;
    loginUser(opts?: {
        username?: string;
        password?: string;
    }): Promise<string>;
    logoutUser(): Promise<void>;
    getUserByName(opts: {
        username: string;
    }): Promise<User>;
    updateUser(opts: {
        username: string;
        body?: User;
    }): Promise<void>;
    deleteUser(opts: {
        username: string;
    }): Promise<void>;
}
