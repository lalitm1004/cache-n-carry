import createPersistentStore from "$lib/utils/createPersistentStore";

export interface IUser {
    id: string;
    name: string;
    email: string;
}

export interface IStudent extends IUser {
    type: 'student',
    rollNumber: string;
    currentRoomId: string;
    nextRoomId: string | null;
}

export interface IStaff extends IUser {
    type: 'staff';
};

export const TOKEN_NAME = 'cachencarry-user'
const {
    store: UserStore, set: setUser
} = createPersistentStore<IStudent | IStaff | null>(TOKEN_NAME);

export { UserStore, setUser }