import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { SiteConfigModel } from "@/db/models";
import { SiteAuth } from "@/engine/sites/auth";
import { Button, InputGroup, Icon, RadioGroup, Radio } from "@blueprintjs/core";

type AuthMethodType = SiteAuth["method"]["type"];

type SiteAuthEditorProps = {
    auth: SiteAuth;
    updateConfig: (
        partialConfig: Partial<SiteConfigModel>,
    ) => Promise<SiteConfigModel>;
};

const DEFAULT_AUTH: Required<SiteConfigModel["auth"]> = {
    method: { type: "none" },
    creds: { username: "", password: "" },
};

export default function SiteAuthEditor({
    auth,
    updateConfig,
}: SiteAuthEditorProps) {
    const [currentAuth, setCurrentAuth] = useState<SiteAuth>(auth);
    const [selectedMethod, setSelectedMethod] = useState<AuthMethodType>(
        auth.method.type,
    );

    const handleMethodChange = useCallback(
        (event: React.FormEvent<HTMLInputElement>) => {
            setSelectedMethod(event.currentTarget.value as AuthMethodType);
        },
        [],
    );

    return (
        <div>
            <h1 className="py-3 font-semibold">
                Site Authentication <Icon icon="key" />
            </h1>
            <Button
                text="Save"
                icon="floppy-disk"
                onClick={() => updateConfig({ auth: currentAuth })}
                disabled={currentAuth === auth}
            />
            <br />
            <br />
            <RadioGroup
                label="Authentication Method"
                selectedValue={selectedMethod}
                onChange={handleMethodChange}
            >
                <Radio label="None" value={"none" as AuthMethodType} />
                <Radio label="http" value={"http" as AuthMethodType} />
                <Radio label="form" value={"form" as AuthMethodType} />
            </RadioGroup>{" "}
            <br />
            {selectedMethod !== "none" && (
                <>
                    <div>
                        Username: <InputGroup />
                    </div>
                    <div>
                        Password: <InputGroup />
                    </div>
                </>
            )}
        </div>
    );
}

function ConfigureAuthHTTP({
    currentAuth,
    setCurrentAuth,
}: {
    currentAuth: SiteAuth;
    setCurrentAuth: Dispatch<SetStateAction<SiteAuth>>;
}) {
    return <></>;
}

function ConfigureAuthForm({
    currentAuth,
    setCurrentAuth,
}: {
    currentAuth: SiteAuth;
    setCurrentAuth: Dispatch<SetStateAction<SiteAuth>>;
}) {
    return <></>;
}
