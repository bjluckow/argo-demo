import {
    DomainModel,
    LinkPathnameModel,
    PageScrapeModel,
} from "@/db/models";

type PageScrapeViewProps = {
    pagescrape: PageScrapeModel;
    linkpath: LinkPathnameModel;
    domain: DomainModel;
};

export default function PageScrapeView({
    pagescrape,
    domain,
    linkpath,
}: PageScrapeViewProps) {
    const fullLink = new URL(linkpath.pathname, domain.homeLink).href;
    const date = new Date(pagescrape.startTime).toLocaleString();
    const interval = (pagescrape.endTime - pagescrape.startTime) / 1000;

    return (
        <div>
            <h1>{fullLink}</h1>
            <h2 className="font-light">
                {date} ({interval}s)
            </h2>
        </div>
    );
}
