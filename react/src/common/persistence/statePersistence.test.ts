import {
    localStoragePersistence,
    PersistenceMode,
    setPersistenceMode,
    STORAGE_KEY
} from "./statePersistence";

describe("statePersistence", () => {
    afterEach(() => {
        localStorage.clear();
        setPersistenceMode(PersistenceMode.Local);
    });

    it("loads saved localStorage state in local mode", () => {
        localStorage.setItem(`${STORAGE_KEY}_activeDiagramId`, JSON.stringify("saved-diagram"));
        const setSelf = jest.fn();
        const onSet = jest.fn();

        localStoragePersistence<string>("activeDiagramId")({
            setSelf,
            onSet,
            trigger: "get"
        } as any);

        expect(setSelf).toHaveBeenCalledWith("saved-diagram");
        expect(onSet).toHaveBeenCalled();
    });

    it("does not read or write localStorage in host mode", () => {
        setPersistenceMode(PersistenceMode.Host);
        localStorage.setItem(`${STORAGE_KEY}_activeDiagramId`, JSON.stringify("saved-diagram"));
        const setSelf = jest.fn();
        const onSet = jest.fn();

        localStoragePersistence<string>("activeDiagramId")({
            setSelf,
            onSet,
            trigger: "get"
        } as any);

        expect(setSelf).not.toHaveBeenCalled();
        expect(onSet).not.toHaveBeenCalled();
    });
});
