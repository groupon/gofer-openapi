/* eslint-disable */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetStoreBase = void 0;
const gofer_1 = __importDefault(require("gofer"));
class PetStoreBase extends gofer_1.default {
    addPet(pet) {
        return this.post("/pet", {
            endpointName: "addPet",
            json: pet
        }).json();
    }
    updatePet(pet) {
        return this.put("/pet", {
            endpointName: "updatePet",
            json: pet
        }).json();
    }
    findPetsByStatus(opts = {}) {
        return this.get("/pet/findByStatus", {
            endpointName: "findPetsByStatus",
            qs: {
                status: opts.status
            }
        }).json();
    }
    findPetsByTags(opts = {}) {
        return this.get("/pet/findByTags", {
            endpointName: "findPetsByTags",
            qs: {
                tags: opts.tags
            }
        }).json();
    }
    getPetById(opts) {
        return this.get("/pet/{petId}", {
            endpointName: "getPetById",
            pathParams: {
                petId: `${opts.petId}`
            }
        }).json();
    }
    updatePetWithForm(opts) {
        return this.post("/pet/{petId}", {
            endpointName: "updatePetWithForm",
            qs: {
                name: opts.name,
                status: opts.status
            },
            pathParams: {
                petId: `${opts.petId}`
            }
        }).rawBody().then(() => { });
    }
    deletePet(opts) {
        return this.delete("/pet/{petId}", {
            endpointName: "deletePet",
            pathParams: {
                petId: `${opts.petId}`
            },
            headers: {
                api_key: opts.apiKey
            }
        }).rawBody().then(() => { });
    }
    uploadFile(opts) {
        return this.post("/pet/{petId}/uploadImage", {
            endpointName: "uploadFile",
            qs: {
                additionalMetadata: opts.additionalMetadata
            },
            pathParams: {
                petId: `${opts.petId}`
            }
        }).json();
    }
    getInventory() {
        return this.get("/store/inventory", {
            endpointName: "getInventory"
        }).json();
    }
    placeOrder(order) {
        return this.post("/store/order", {
            endpointName: "placeOrder",
            json: order
        }).json();
    }
    getOrderById(opts) {
        return this.get("/store/order/{orderId}", {
            endpointName: "getOrderById",
            pathParams: {
                orderId: `${opts.orderId}`
            }
        }).json();
    }
    deleteOrder(opts) {
        return this.delete("/store/order/{orderId}", {
            endpointName: "deleteOrder",
            pathParams: {
                orderId: `${opts.orderId}`
            }
        }).rawBody().then(() => { });
    }
    createUser(user) {
        return this.post("/user", {
            endpointName: "createUser",
            json: user
        }).rawBody().then(() => { });
    }
    createUsersWithListInput(users) {
        return this.post("/user/createWithList", {
            endpointName: "createUsersWithListInput",
            json: users
        }).json();
    }
    loginUser(opts = {}) {
        return this.get("/user/login", {
            endpointName: "loginUser",
            qs: {
                username: opts.username,
                password: opts.password
            }
        }).json();
    }
    logoutUser() {
        return this.get("/user/logout", {
            endpointName: "logoutUser"
        }).rawBody().then(() => { });
    }
    getUserByName(opts) {
        return this.get("/user/{username}", {
            endpointName: "getUserByName",
            pathParams: {
                username: opts.username
            }
        }).json();
    }
    updateUser(opts) {
        return this.put("/user/{username}", {
            endpointName: "updateUser",
            pathParams: {
                username: opts.username
            },
            json: opts.body
        }).rawBody().then(() => { });
    }
    deleteUser(opts) {
        return this.delete("/user/{username}", {
            endpointName: "deleteUser",
            pathParams: {
                username: opts.username
            }
        }).rawBody().then(() => { });
    }
}
exports.PetStoreBase = PetStoreBase;
