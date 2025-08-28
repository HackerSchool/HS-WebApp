import { Fragment, useState, useEffect, useCallback } from "react";
import { mockLeaderboardAPI } from "../../services/mockDataService";
import "./History.css";

const History = () => {
    const [historyData, setHistoryData] = useState([]);
    const [teams, setTeams] = useState([]);
    const [individuals, setIndividuals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [entityType, setEntityType] = useState("teams");
    const [entityFilter, setEntityFilter] = useState("all");
    const [pointsType, setPointsType] = useState("all");
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [showEntityDropdown, setShowEntityDropdown] = useState(false);
    const [selectedEntities, setSelectedEntities] = useState(new Set());

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [history, teamsData, individualsData] = await Promise.all([
                mockLeaderboardAPI.getAllHistory(),
                mockLeaderboardAPI.getTeams(),
                mockLeaderboardAPI.getIndividuals(),
            ]);

            setHistoryData(history);
            setTeams(teamsData);
            setIndividuals(individualsData);
        } catch (error) {
            console.error("Error fetching history data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Reset selected entities when entity type changes
        setSelectedEntities(new Set());
        setEntityFilter("all");
    }, [entityType]);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (
                showEntityDropdown &&
                !event.target.closest(".entity-dropdown-container")
            ) {
                setShowEntityDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEntityDropdown]);

    const getFilteredData = () => {
        let filtered = historyData;

        // Filter by entity
        if (entityFilter !== "all" && entityFilter !== "multiple") {
            if (entityType === "teams") {
                filtered = filtered.filter(
                    (entry) => entry.equipa === entityFilter
                );
            } else {
                filtered = filtered.filter(
                    (entry) => entry.membro === entityFilter
                );
            }
        } else if (entityFilter === "multiple" && selectedEntities.size > 0) {
            if (entityType === "teams") {
                filtered = filtered.filter((entry) =>
                    selectedEntities.has(entry.equipa)
                );
            } else {
                filtered = filtered.filter((entry) =>
                    selectedEntities.has(entry.membro)
                );
            }
        }

        // Filter by points type
        if (pointsType !== "all") {
            filtered = filtered.filter((entry) => entry.tipo === pointsType);
        }

        return filtered;
    };

    const getEntityOptions = () => {
        if (entityType === "teams") {
            return teams.map((team) => ({
                value: team.name,
                label: team.name,
            }));
        } else {
            return individuals.map((individual) => ({
                value: individual.name,
                label: individual.name,
            }));
        }
    };

    const toggleRowExpansion = (rowId) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(rowId)) {
            newExpandedRows.delete(rowId);
        } else {
            newExpandedRows.add(rowId);
        }
        setExpandedRows(newExpandedRows);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getPointTypeColor = (type) => {
        return type === "PJ" ? "rgb(231, 76, 60)" : "rgb(52, 152, 219)";
    };

    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    const handleEntityTypeChange = (newType) => {
        setEntityType(newType);
        setEntityFilter("all");
        setCurrentPage(1);
    };

    const toggleEntitySelection = (entityName) => {
        const newSelected = new Set(selectedEntities);
        if (newSelected.has(entityName)) {
            newSelected.delete(entityName);
        } else {
            newSelected.add(entityName);
        }
        setSelectedEntities(newSelected);

        // Update entityFilter based on selection
        if (newSelected.size === 0) {
            setEntityFilter("all");
        } else if (newSelected.size === 1) {
            setEntityFilter(Array.from(newSelected)[0]);
        } else {
            setEntityFilter("multiple");
        }
        setCurrentPage(1);
    };

    const selectAllEntities = () => {
        const currentOptions = getEntityOptions();
        const allNames = currentOptions.map((option) => option.value);
        setSelectedEntities(new Set(allNames));
        setEntityFilter("multiple");
        setCurrentPage(1);
    };

    const clearEntitySelection = () => {
        setSelectedEntities(new Set());
        setEntityFilter("all");
        setCurrentPage(1);
    };

    const getSelectedEntitiesText = () => {
        if (selectedEntities.size === 0) return "All";
        if (selectedEntities.size === 1) return Array.from(selectedEntities)[0];
        if (selectedEntities.size === getEntityOptions().length) return "All";
        return `${selectedEntities.size} selected`;
    };

    const handlePointsTypeChange = (newType) => {
        setPointsType(newType);
        setCurrentPage(1);
    };

    if (loading) {
        return <div className="loading">Loading log...</div>;
    }

    return (
        <div className="history-container">
            <header className="history-header">
                <h1>📊 Points Log</h1>
                <p>Track all point activities and achievements</p>
            </header>

            <div className="history-content">
                <div className="history-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>
                                    <div className="header-controls">
                                        <span>
                                            {entityType === "teams"
                                                ? "Team"
                                                : "Member"}
                                        </span>
                                        <div className="entity-selector">
                                            <select
                                                value={entityType}
                                                onChange={(e) =>
                                                    handleEntityTypeChange(
                                                        e.target.value
                                                    )
                                                }
                                                className="inline-select"
                                            >
                                                <option value="teams">
                                                    Teams
                                                </option>
                                                <option value="members">
                                                    Members
                                                </option>
                                            </select>
                                            <div className="entity-dropdown-container">
                                                <button
                                                    className="entity-dropdown-toggle"
                                                    onClick={() =>
                                                        setShowEntityDropdown(
                                                            !showEntityDropdown
                                                        )
                                                    }
                                                >
                                                    <span>▼</span>
                                                </button>
                                                {showEntityDropdown && (
                                                    <div className="entity-dropdown">
                                                        <div className="dropdown-header">
                                                            <button
                                                                className="select-all-btn"
                                                                onClick={
                                                                    selectAllEntities
                                                                }
                                                            >
                                                                Select All
                                                            </button>
                                                            <button
                                                                className="clear-btn"
                                                                onClick={
                                                                    clearEntitySelection
                                                                }
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                        <div className="dropdown-content">
                                                            {getEntityOptions().map(
                                                                (option) => (
                                                                    <label
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        className="checkbox-item"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedEntities.has(
                                                                                option.value
                                                                            )}
                                                                            onChange={() =>
                                                                                toggleEntitySelection(
                                                                                    option.value
                                                                                )
                                                                            }
                                                                        />
                                                                        <span className="checkmark"></span>
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </label>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="dropdown-footer">
                                                            <span className="selection-summary">
                                                                {getSelectedEntitiesText()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </th>
                                {entityType === "members" && <th>Team</th>}
                                <th>
                                    <div className="header-controls">
                                        <span>Description</span>
                                    </div>
                                </th>
                                <th>
                                    <div className="header-controls">
                                        <span>Points</span>
                                        <select
                                            value={pointsType}
                                            onChange={(e) =>
                                                handlePointsTypeChange(
                                                    e.target.value
                                                )
                                            }
                                            className="inline-select"
                                        >
                                            <option value="all">All</option>
                                            <option value="PJ">PJ</option>
                                            <option value="PCC">PCC</option>
                                        </select>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            entityType === "members" ? 5 : 4
                                        }
                                        className="no-data"
                                    >
                                        No log entries found for the selected
                                        filters.
                                    </td>
                                </tr>
                            ) : (
                                pageData.map((entry, index) => {
                                    const rowId = `history-row-${currentPage}-${index}`;
                                    const isExpanded = expandedRows.has(rowId);

                                    return (
                                        <Fragment key={rowId}>
                                            <tr
                                                className={`history-row clickable-row ${
                                                    isExpanded ? "expanded" : ""
                                                }`}
                                                onClick={() =>
                                                    toggleRowExpansion(rowId)
                                                }
                                            >
                                                <td className="date-cell">
                                                    {formatDate(entry.data)}
                                                </td>
                                                <td className="entity-cell">
                                                    {entityType === "teams"
                                                        ? entry.equipa
                                                        : entry.membro}
                                                </td>
                                                {entityType === "members" && (
                                                    <td className="team-cell">
                                                        {entry.equipa}
                                                    </td>
                                                )}
                                                <td
                                                    className="description-cell"
                                                    title={entry.descrição}
                                                >
                                                    {entry.descrição}
                                                </td>
                                                <td className="points-cell">
                                                    <span
                                                        className="points-type"
                                                        style={{
                                                            color: getPointTypeColor(
                                                                entry.tipo
                                                            ),
                                                        }}
                                                    >
                                                        {entry.tipo}
                                                    </span>
                                                    +{entry.pontos}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="description-row">
                                                    <td
                                                        colSpan={
                                                            entityType ===
                                                            "members"
                                                                ? 5
                                                                : 4
                                                        }
                                                        className="description-cell"
                                                    >
                                                        <div className="description-content">
                                                            <h4>
                                                                📝 Activity Full
                                                                Description
                                                            </h4>
                                                            <p>
                                                                {
                                                                    entry.descrição
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    <span>←</span> Previous
                </button>
                <div className="page-info">
                    <span>{currentPage}</span> of <span>{totalPages}</span>
                </div>
                <button
                    className="pagination-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next <span>→</span>
                </button>
            </div>
        </div>
    );
};

export default History;
