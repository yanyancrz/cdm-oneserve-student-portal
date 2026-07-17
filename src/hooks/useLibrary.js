import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getBooks } from "../services/libraryService";

export default function useLibrary() {

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Favorites (temporary localStorage)
    const [favoriteIds, setFavoriteIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("libraryFavorites")) || [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(
            "libraryFavorites",
            JSON.stringify(favoriteIds)
        );
    }, [favoriteIds]);

    const fetchBooks = async () => {

        try {

            setLoading(true);
            setError(null);

            const response = await getBooks();

            setBooks(response.data);

        } catch (err) {

            console.error(err);

            setError(err.message);

            toast.error("Failed to load books.");

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const categories = useMemo(() => {

        const values = books
            .map(book => book.category)
            .filter(Boolean);

        return ["All", ...new Set(values)];

    }, [books]);

    const isFavorite = (bookId) =>
        favoriteIds.includes(bookId);

    const toggleFavorite = (bookId) => {

        setFavoriteIds(prev => {

            const updated = prev.includes(bookId)
                ? prev.filter(id => id !== bookId)
                : [...prev, bookId];

            return updated;

        });

    };

    return {

        books,

        loading,

        error,

        categories,

        fetchBooks,

        isFavorite,

        toggleFavorite

    };
}