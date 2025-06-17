import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"

export default function TablePagination({ pagesNumber, activePage, setActivePage }) {
    const handlePrev = () => {
        if (activePage > 1) setActivePage(activePage - 1);
    };

    const handleNext = () => {
        if (activePage < pagesNumber) setActivePage(activePage + 1);
    };

    return (
        pagesNumber > 1 &&
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationLink className="cursor-pointer" onClick={handlePrev} disabled={activePage === 1} size="sm">
                        Précédent
                    </PaginationLink>
                </PaginationItem>

                {Array.from({ length: pagesNumber }, (_, i) => {
                    const page = i + 1;
                    return (
                        <PaginationItem key={page}>
                            <PaginationLink
                                className="cursor-pointer"
                                onClick={() => setActivePage(page)}
                                isActive={activePage === page}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}

                <PaginationItem>
                    <PaginationLink className="cursor-pointer" onClick={handleNext} disabled={activePage === pagesNumber} size="sm">
                        Suivant
                    </PaginationLink>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
