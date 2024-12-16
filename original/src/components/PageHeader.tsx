export default function PageHeader({ headerText }: { headerText: string }) {
    return (
        <h1 className="ml-3 mt-5 w-fit rounded-md   p-3 text-2xl font-semibold  caret-transparent shadow-sm">
            {headerText}
        </h1>
    );
}
