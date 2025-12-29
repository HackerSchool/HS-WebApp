import React from 'react';
import './Pagination.css';

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    showInfo = true,
    showPageNumbers = true,
    maxPageNumbers = 5
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
        const endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="hl-pagination-container">
            {showInfo && (
                <div className="hl-pagination-info">
                    Showing {startItem} to {endItem} of {totalItems} entries
                </div>
            )}
            
            <div className="hl-pagination-controls">
                <button
                    className="hl-pagination-btn hl-pagination-prev"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                >
                    ‹
                </button>

                {showPageNumbers && (
                    <>
                        {getPageNumbers()[0] > 1 && (
                            <>
                                <button
                                    className="hl-pagination-btn hl-pagination-number"
                                    onClick={() => onPageChange(1)}
                                >
                                    1
                                </button>
                                {getPageNumbers()[0] > 2 && (
                                    <span className="hl-pagination-ellipsis">...</span>
                                )}
                            </>
                        )}

                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                className={`hl-pagination-btn hl-pagination-number ${
                                    page === currentPage ? 'hl-pagination-active' : ''
                                }`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        ))}

                        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                            <>
                                {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                                    <span className="hl-pagination-ellipsis">...</span>
                                )}
                                <button
                                    className="hl-pagination-btn hl-pagination-number"
                                    onClick={() => onPageChange(totalPages)}
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </>
                )}

                <button
                    className="hl-pagination-btn hl-pagination-next"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next page"
                >
                    ›
                </button>
            </div>

            <div className="hl-pagination-jump">
                <select
                    value={currentPage}
                    onChange={(e) => onPageChange(parseInt(e.target.value))}
                    className="hl-pagination-select"
                >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <option key={page} value={page}>
                            Page {page}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default Pagination;
