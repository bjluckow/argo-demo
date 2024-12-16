"use client";
import "@blueprintjs/core/lib/css/blueprint.css";
import { Navbar } from "@blueprintjs/core";
import { Alignment } from "@blueprintjs/core";
import { Button } from "@blueprintjs/core";
import Link from "next/link";

export default function NavBar() {
    return (
        <Navbar>
            <Navbar.Group align={Alignment.LEFT}>
                <Link className="px-1" href={"/"}>
                    <Button text="Dashboard" icon="ship" />
                </Link>
                <Link className="px-1" href={"/domains"}>
                    <Button text="Domains" icon="ip-address" />
                </Link>
                <Link className="px-1" href={"/scan"}>
                    <Button text="Scan Web" icon="globe-network" />
                </Link>
                <Link className="px-1" href={"/data"}>
                    <Button text="Data Portal" icon="database" />
                </Link>
            </Navbar.Group>
        </Navbar>
    );
}

/* <Navbar.Heading>ARGO</Navbar.Heading>
            <Navbar.Divider /> */
/* <Link className="px-1" href={"/domains"}>
                <Button text="Domains" icon="ip-address" />
            </Link>
            <Link className="px-1" href={"/web"}>
                <Button text="Scan Web" icon="globe-network" />
            </Link>
            <Link className="px-1" href={"/"}>
                <Button text="Data Portal" icon="database" />
            </Link>
            <Link className="px-1" href={"/"}>
                <Button text="Clients" icon="team" />
            </Link> */
