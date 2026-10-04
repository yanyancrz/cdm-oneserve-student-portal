import { useState } from "react";
import toast from "react-hot-toast";

import Modal from "../common/Modal";
import BookForm from "./BookForm";
import { bookService } from "../../services/bookService";

export default function AddBookModal({ open, onClose, onSaved }) {
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (values, files) => {
        setSaving(true);

        let book;

        try {
            book = await bookService.create(values);
        } catch (error) {
            toast.error(error?.message || "Unable to add the book.");
            setSaving(false);
            return;
        }

        try {
            await bookService.uploadFiles(book.bookId, files);
            toast.success("Book added.");
        } catch (error) {
            // The book itself is saved, so say exactly what failed.
            toast.error(`Book added, but a file failed to upload: ${error?.message || "unknown error"}`);
        }

        setSaving(false);
        onSaved?.();
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={saving ? undefined : onClose}
            title="Add Book"
            size="lg"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-book-form"
                        disabled={saving}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Add book"}
                    </button>
                </>
            }
        >
            <BookForm formId="add-book-form" onSubmit={handleSubmit} />
        </Modal>
    );
}