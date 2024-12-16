import { DomainErrorInfo } from "@/db/domainQueries";
import { DomainModel } from "@/db/models";
import PageErrorView from "../views/PageErrorView";

type DomainErrorsViewProps = {
    domain: DomainModel;
    lastError?: DomainErrorInfo;
    recentErrors?: DomainErrorInfo[];
};

export default function DomainErrorsView({
    domain,
    lastError,
    recentErrors,
}: DomainErrorsViewProps) {
    if (!lastError && (!recentErrors || recentErrors.length === 0)) {
        return (
            <div className="my-5 max-w-full rounded-lg border border-green-400 p-3">
                <h1 className="font-bold">No Errors</h1>
            </div>
        );
    }

    return (
        <div className="my-5 max-w-full rounded-lg border border-red-400 p-3">
            <h1 className="font-bold ">Errors</h1>

            {lastError && (
                <div className="my-5">
                    <h2 className="font-semibold">Last Error</h2>
                    <PageErrorView
                        pageerror={lastError.pageerrors}
                        link={
                            new URL(
                                lastError.linkpaths.pathname,
                                domain.homeLink,
                            ).href
                        }
                    />
                </div>
            )}

            {recentErrors && recentErrors.length > 0 && (
                <div className="my-5">
                    <h1 className="font-semibold">
                        {recentErrors.length} errors in past 24 hours
                    </h1>
                </div>
            )}

            {/** TODO: render recent errors */}
        </div>
    );
}
