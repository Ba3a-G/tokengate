interface Data {
    [key: string]: unknown;
}

class Redis {
    private data: Data;

    constructor() {
        this.data = {};
    }

    set<T>(key: string, value: T): void {
        this.data[key] = value;
    }

    get<T>(key: string): T | undefined {
        return this.data[key] as T;
    }

    del(key: string): void {
        delete this.data[key];
    }

    keys(): string[] {
        return Object.keys(this.data);
    }

    flushall(): void {
        this.data = {};
    }
}

export default new Redis();