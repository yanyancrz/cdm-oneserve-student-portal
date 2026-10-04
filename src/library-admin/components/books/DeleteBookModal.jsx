import { useState } from "react";
import toast from "react-hot-toast";
import { TriangleAlert } from "lucide-react";

import Modal from "../common/Modal";
import { bookService } from "../../services/bookService";

export default function DeleteBookModal({ book, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);

    if (!book) return null;

    const confirm = async () => {
        setDeleting(true);

        try {
            await bookService.remove(book.bookId);
            toast.success("Book deleted.");
            onDeleted?.();
            onClose();
        } catch (error) {
            toast.error(error?.message || "Unable to delete the book.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Modal
            open
            onClose={deleting ? undefined : onClose}
            title="Delete Book"
            size="sm"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={deleting}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </>
            }
        >
            <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <TriangleAlert size={18} />
                </div>

                <div className="text-sm text-gray-600">
                    <p>
                        Delete <span className="font-semibold text-[#1F1F1F]">{book.title}</span>? This also removes
                        its cover and e-book file.
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                        Books that have borrowing or reservation history cannot be deleted.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
