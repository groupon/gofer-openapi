import { PetStoreBase } from './petstore-base';

class PetStore extends PetStoreBase {
  constructor() {
    super(
      { petStore: { baseUrl: 'http://localhost:8000'} },
      'petStore',
      '1.0.0'
    );
  }
}