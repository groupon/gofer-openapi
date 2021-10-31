/* eslint-disable */
import Gofer from "gofer";
export type Order = {
  id?: number,
  petId?: number,
  quantity?: number,
  shipDate?: string,
  status?: "placed" | "approved" | "delivered",
  complete?: boolean,
};
export type Customer = {
  id?: number,
  username?: string,
  address?: Address[],
};
export type Address = {
  street?: string,
  city?: string,
  state?: string,
  zip?: string,
};
export type Category = {
  id?: number,
  name?: string,
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
export type Tag = {
  id?: number,
  name?: string,
};
export type Pet = {
  id?: number,
  name: string,
  category?: Category,
  photoUrls: string[],
  tags?: Tag[],
  status?: "available" | "pending" | "sold",
};
export type ApiResponse = {
  code?: number,
  type?: string,
  message?: string,
};
export class PetStoreBase extends Gofer {
  addPet(pet: Pet): Promise<Pet> {
    return this.post("/pet", {
      endpointName: "addPet",
      json: pet
    }).json();
  }

  updatePet(pet: Pet): Promise<Pet> {
    return this.put("/pet", {
      endpointName: "updatePet",
      json: pet
    }).json();
  }

  findPetsByStatus(opts: {
    status?: "available" | "pending" | "sold"
  } = {}): Promise<Pet[]> {
    return this.get("/pet/findByStatus", {
      endpointName: "findPetsByStatus",
      qs: {
        status: opts.status
      }
    }).json();
  }

  findPetsByTags(opts: {
    tags?: string[]
  } = {}): Promise<Pet[]> {
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
        petId: opts.petId
      }
    }).json();
  }

  updatePetWithForm(opts: {
    petId: number,
    name?: string,
    status?: string,
  }): Promise<void> {
    return this.post("/pet/{petId}", {
      endpointName: "updatePetWithForm",
      qs: {
        name: opts.name,
        status: opts.status
      },
      pathParams: {
        petId: opts.petId
      }
    }).json();
  }

  deletePet(opts: {
    apiKey?: string,
    petId: number,
  }): Promise<void> {
    return this.delete("/pet/{petId}", {
      endpointName: "deletePet",
      pathParams: {
        petId: opts.petId
      },
      headers: {
        api_key: opts.apiKey
      }
    }).json();
  }

  uploadFile(opts: {
    petId: number,
    additionalMetadata?: string,
  }): Promise<ApiResponse> {
    return this.post("/pet/{petId}/uploadImage", {
      endpointName: "uploadFile",
      qs: {
        additionalMetadata: opts.additionalMetadata
      },
      pathParams: {
        petId: opts.petId
      }
    }).json();
  }

  getInventory(): Promise<Record<string, number>> {
    return this.get("/store/inventory", {
      endpointName: "getInventory"
    }).json();
  }

  placeOrder(order?: Order): Promise<Order> {
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
        orderId: opts.orderId
      }
    }).json();
  }

  deleteOrder(opts: {
    orderId: number
  }): Promise<void> {
    return this.delete("/store/order/{orderId}", {
      endpointName: "deleteOrder",
      pathParams: {
        orderId: opts.orderId
      }
    }).json();
  }

  createUser(user?: User): Promise<void> {
    return this.post("/user", {
      endpointName: "createUser",
      json: user
    }).json();
  }

  createUsersWithListInput(users?: User[]): Promise<User> {
    return this.post("/user/createWithList", {
      endpointName: "createUsersWithListInput",
      json: users
    }).json();
  }

  loginUser(opts: {
    username?: string,
    password?: string,
  } = {}): Promise<string> {
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
    }).json();
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
    body?: User,
  }): Promise<void> {
    return this.put("/user/{username}", {
      endpointName: "updateUser",
      pathParams: {
        username: opts.username
      },
      json: opts.body
    }).json();
  }

  deleteUser(opts: {
    username: string
  }): Promise<void> {
    return this.delete("/user/{username}", {
      endpointName: "deleteUser",
      pathParams: {
        username: opts.username
      }
    }).json();
  }

}