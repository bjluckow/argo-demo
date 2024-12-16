import { useState } from "react";
import { serverCreateNewDomainAndConfig } from "@/app/_api/scanAPI";
import { Icon, InputGroup, Intent, Button } from "@blueprintjs/core";

export default function DomainCreation() {
    const [domainName, setDomainName] = useState<string>("");
    const [homepageLink, setHomepageLink] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<string>();

    const homepageLinkIsValid =
        homepageLink.length > 0 && URL.canParse(homepageLink);
    const canSubmit =
        domainName !== "" &&
        homepageLink !== "" &&
        homepageLinkIsValid &&
        !isSaving;

    const handleCreation = async () => {
        if (canSubmit) {
            try {
                setIsSaving(true);
                const id = await serverCreateNewDomainAndConfig(
                    domainName,
                    homepageLink,
                );

                setStatusMsg(
                    `Successfully created domain '${homepageLink}' and site config (ID: ${id})`,
                );
                setDomainName("");
                setHomepageLink("");
            } catch (e) {
                setStatusMsg(`ERROR: Unable to save domain`);
            }
        } else {
            setStatusMsg(`ERROR: Invalid hostname`);
        }
        setIsSaving(false);
    };

    return (
        <div className="my-5">
            Domain Name
            <InputGroup
                placeholder="Enter domain name"
                value={domainName ?? ""}
                onValueChange={(newValue) => setDomainName(newValue)}
            />
            <br />
            Host URL
            <InputGroup
                placeholder="Enter homepage URL"
                value={homepageLink ?? ""}
                onValueChange={(newValue) => setHomepageLink(newValue)}
                intent={
                    homepageLink === ""
                        ? Intent.PRIMARY
                        : homepageLinkIsValid
                          ? Intent.SUCCESS
                          : Intent.DANGER
                }
            />
            {homepageLinkIsValid && (
                <p className="font-thin italic">
                    <Icon icon="tick" /> Homepage Link: {homepageLink}{" "}
                    (Hostname: {new URL(homepageLink).hostname})
                </p>
            )}
            <br />
            <Button
                className="mr-3"
                onClick={handleCreation}
                disabled={!canSubmit}
            >
                <Icon icon="confirm" className="mr-3" /> Save Domain
            </Button>
            {statusMsg && statusMsg !== "" && <>{" " + statusMsg}</>}
        </div>
    );
}
