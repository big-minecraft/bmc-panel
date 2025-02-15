export abstract class CustomEnum<T extends EnumValue> {
    private readonly enumValues: T[] = [];

    protected constructor() {}

    public values(): T[] {
        return [...this.enumValues];
    }

    public getFromIndex(index: number) {
        return this.enumValues[index];
    }

    public addValue(enumValue: T) {
        enumValue.setIndex(this.enumValues.length);
        this.enumValues.push(enumValue);
        return enumValue;
    }

    public size() {
        return this.enumValues.length;
    }
}

export abstract class EnumValue {
    private index: number;

    protected constructor() {}

    public getIndex() {
        return this.index;
    }

    public setIndex(index: number) {
        this.index = index;
    }
}
