import { DomainInfo } from "@/db/domainQueries";
import { DomainModel } from "@/db/models";
import DomainErrorsView from "./DomainErrorsView";

type DomainInfoViewProps = { domainInfo: DomainInfo; domain: DomainModel };

export default function DomainInfoView({
    domainInfo,
    domain,
}: DomainInfoViewProps) {
    const {
        numVisitedLinks,
        numUnvisitedLinks,
        numFailedLinks,
        numVisitedSitemapLinks,
        numUnvisitedSitemapLinks,
        numFailedSitemapLinks,
        recentErrors,
    } = domainInfo;

    return (
        <div>
            <p>
                {numVisitedLinks - numVisitedSitemapLinks} pages visited,{" "}
                {numUnvisitedLinks - numUnvisitedSitemapLinks} pages unvisited,{" "}
                {numFailedLinks - numFailedSitemapLinks} pages failed
            </p>
            <p>
                {numVisitedSitemapLinks} sitemaps visited,{" "}
                {numUnvisitedSitemapLinks} sitemaps unvisited,{" "}
                {numFailedSitemapLinks} sitemaps failed
            </p>

            <div className="my-5" />

            <DomainErrorsView recentErrors={recentErrors} domain={domain} />
        </div>
    );
}
