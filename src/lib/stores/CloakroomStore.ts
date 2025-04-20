import createPersistentStore from "$lib/utils/createPersistentStore";

export interface IWarehouse {
    name: string;
}

export const TOKEN_NAME = 'cachencarry-warehouse'
const {
    store: WarehouseStore, set: setWarehouse
} = createPersistentStore<IWarehouse | null>(TOKEN_NAME);

export { WarehouseStore, setWarehouse };