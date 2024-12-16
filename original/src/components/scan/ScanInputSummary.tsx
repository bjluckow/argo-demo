import { DomainModel as DomainMetadataModel } from "@/db/models";

type ScanInputSummary = { selectedDomains: DomainMetadataModel[] };

export default function ScanInputSummary({
    selectedDomains,
}: ScanInputSummary) {
    // const totalUnvisitedLinks = selectedDomains
    //     .map((d) => d.links.unvisited.length)
    //     .reduce((acc, l) => acc + l, 0);

    if (selectedDomains.length === 0) {
        return undefined;
    }

    return (
        <div>
            <ul>
                <li>{selectedDomains.length} domains selected</li>
                {/* <li>{totalUnvisitedLinks} unvisted links stored</li> */}
            </ul>
        </div>
    );
}
