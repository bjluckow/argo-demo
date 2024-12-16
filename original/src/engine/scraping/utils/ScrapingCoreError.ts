export default abstract class ScrapingCoreError<
    T extends string, // Error types usually as string enums
    C,
> extends Error {
    constructor(
        public errorType: T,
        public context: C,
        public caughtError?: Error,
    ) {
        super(ScrapingCoreError.buildMsg(errorType, context, caughtError));
        this.name = this.constructor.name;
    }

    private static buildMsg<T, C>(
        errorType: T,
        context: C,
        caughtError?: Error,
    ): string {
        let baseMessage = `${errorType} | Context: ${JSON.stringify(context)}`;

        if (caughtError) {
            baseMessage += ` | Caused by: ${caughtError.message}`;
        }
        return baseMessage;
    }
}
