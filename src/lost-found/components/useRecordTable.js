import { useState } from "react";
import { selectRecords } from "./recordTable.js";

export function useRecordTable(rows, fields, categories = {}, defaultSort = "") {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [sort, setSort] = useState({ key: defaultSort, desc: true });
    const [page, setPage] = useState(1);
    const result = selectRecords(rows, { fields, categories, search, category, sort, page });
    const reset = () => {
        setSearch("");
        setCategory("");
        setSort({ key: defaultSort, desc: true });
        setPage(1);
    };
    return {
        ...result,
        search, category, sort, reset,
        changeSearch: (value) => { setSearch(value); setPage(1); },
        changeCategory: (value) => { setCategory(value); setPage(1); },
        changeSort: (key) => {
            setSort((previous) => ({ key, desc: previous.key === key && !previous.desc }));
            setPage(1);
        },
        pagination: { ...result.pagination, onPage: setPage },
    };
}
