import { useState } from "react";
import toast from "react-hot-toast";

import Modal from "../common/Modal";
import BookForm from "./BookForm";
import { bookService } from "../../services/bookService";

export default function EditBookModal({ book, onClose, onSaved }) {
    const [saving, setSaving] = useState(false);

    if (!book) return null;

    const handleSubmit = async (values, files) => {
        setSaving(true);

        try {
            await bookService.update(book.bookId, values);
        } catch (error) {
            toast.error(error?.message || "Unable to save the changes.");
            setSaving(false);
            return;
        }

        try {
            await bookService.uploadFiles(book.bookId, files);
            toast.success("Book updated.");
        } catch (error) {
            toast.error(`Changes saved, but a file failed to upload: ${error?.message || "unknown error"}`);
        }

        setSaving(false);
        onSaved?.();
        onClose();
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            title="Edit Book"
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
                        form="edit-book-form"
                        disabled={saving}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </>
            }
        >
            <BookForm
                formId="edit-book-form"
                initial={book}
                existingCoverPath={book.coverImage}
                hasPdf={Boolean(book.pdfFile)}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
}