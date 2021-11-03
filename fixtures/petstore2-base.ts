/* eslint-disable */
import OtherLib from "other-lib";
export type ApiResponse = {
  code?: number,
  type?: string,
  message?: string,
};
export type Category = {
  id?: number,
  name?: string,
};
export type Pet = {
  id?: number,
  category?: Category,
  name: string,
  photoUrls: string[],
  tags?: Tag[],
  status?: "available" | "pending" | "sold",
};
export type Tag = {
  id?: number,
  name?: string,
};
export type Order = {
  id?: number,
  petId?: number,
  quantity?: number,
  shipDate?: string,
  status?: "placed" | "approved" | "delivered",
  complete?: boolean,
};
export type User = {
  id?: number,
  username?: string,
  firstName?: string,
  lastName?: string,
  email?: string,
  password?: string,
  phone?: string,
  userStatus?: number,
};
export default class PetStore2Base extends OtherLib {
  uploadFile(opts: {
    petId: number
  }): Promise<ApiResponse> {
    return this.post("/pet/{petId}/uploadImage", {
      endpointName: "uploadFile",
      pathParams: {
        petId: `${opts.petId}`
      }
    }).json();
  }

  addPet(pet: Pet): Promise<void> {
    return this.post("/pet", {
      endpointName: "addPet",
      json: pet
    }).rawBody().then(() => {});
  }

  updatePet(pet: Pet): Promise<void> {
    return this.put("/pet", {
      endpointName: "updatePet",
      json: pet
    }).rawBody().then(() => {});
  }

  findPetsByStatus(opts: {
    status: ("available" | "pending" | "sold")[]
  }): Promise<Pet[]> {
    return this.get("/pet/findByStatus", {
      endpointName: "findPetsByStatus",
      qs: {
        status: opts.status
      }
    }).json();
  }

  findPetsByTags(opts: {
    tags: string[]
  }): Promise<Pet[]> {
    return this.get("/pet/findByTags", {
      endpointName: "findPetsByTags",
      qs: {
        tags: opts.tags
      }
    }).json();
  }

  getPetById(opts: {
    petId: number
  }): Promise<Pet> {
    return this.get("/pet/{petId}", {
      endpointName: "getPetById",
      pathParams: {
        petId: `${opts.petId}`
      }
    }).json();
  }

  updatePetWithForm(opts: {
    petId: number
  }): Promise<void> {
    return this.post("/pet/{petId}", {
      endpointName: "updatePetWithForm",
      pathParams: {
        petId: `${opts.petId}`
      }
    }).rawBody().then(() => {});
  }

  deletePet(opts: {
    apiKey?: string,
    petId: number,
  }): Promise<void> {
    return this.delete("/pet/{petId}", {
      endpointName: "deletePet",
      pathParams: {
        petId: `${opts.petId}`
      },
      headers: {
        api_key: opts.apiKey
      }
    }).rawBody().then(() => {});
  }

  getInventory(): Promise<Record<string, number>> {
    return this.get("/store/inventory", {
      endpointName: "getInventory"
    }).json();
  }

  placeOrder(order: Order): Promise<Order> {
    return this.post("/store/order", {
      endpointName: "placeOrder",
      json: order
    }).json();
  }

  getOrderById(opts: {
    orderId: number
  }): Promise<Order> {
    return this.get("/store/order/{orderId}", {
      endpointName: "getOrderById",
      pathParams: {
        orderId: `${opts.orderId}`
      }
    }).json();
  }

  deleteOrder(opts: {
    orderId: number
  }): Promise<void> {
    return this.delete("/store/order/{orderId}", {
      endpointName: "deleteOrder",
      pathParams: {
        orderId: `${opts.orderId}`
      }
    }).rawBody().then(() => {});
  }

  createUsersWithListInput(users: User[]): Promise<void> {
    return this.post("/user/createWithList", {
      endpointName: "createUsersWithListInput",
      json: users
    }).rawBody().then(() => {});
  }

  getUserByName(opts: {
    username: string
  }): Promise<User> {
    return this.get("/user/{username}", {
      endpointName: "getUserByName",
      pathParams: {
        username: opts.username
      }
    }).json();
  }

  updateUser(opts: {
    username: string,
    body: User,
  }): Promise<void> {
    return this.put("/user/{username}", {
      endpointName: "updateUser",
      pathParams: {
        username: opts.username
      },
      json: opts.body
    }).rawBody().then(() => {});
  }

  deleteUser(opts: {
    username: string
  }): Promise<void> {
    return this.delete("/user/{username}", {
      endpointName: "deleteUser",
      pathParams: {
        username: opts.username
      }
    }).rawBody().then(() => {});
  }

  loginUser(opts: {
    username: string,
    password: string,
  }): Promise<string> {
    return this.get("/user/login", {
      endpointName: "loginUser",
      qs: {
        username: opts.username,
        password: opts.password
      }
    }).json();
  }

  logoutUser(): Promise<void> {
    return this.get("/user/logout", {
      endpointName: "logoutUser"
    }).rawBody().then(() => {});
  }

  createUsersWithArrayInput(users: User[]): Promise<void> {
    return this.post("/user/createWithArray", {
      endpointName: "createUsersWithArrayInput",
      json: users
    }).rawBody().then(() => {});
  }

  createUser(user: User): Promise<void> {
    return this.post("/user", {
      endpointName: "createUser",
      json: user
    }).rawBody().then(() => {});
  }

}