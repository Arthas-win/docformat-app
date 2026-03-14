import { useState } from "react";
import { useForm } from "react-hook-form";

function FormatDocument() {
    const { register, handleSubmit } = useForm({
        defaultValues: {
            fontFamily: "Шрифт",
            fontSize: "Розмір шрифту",
            lineSpacing: "Відступ",
            pageNumbers: true,
            outputFormat: "docx",
        },
    });

    const [fileName, setFileName] = useState("");
    const [fileObj, setFileObj] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resultReady, setResultReady] = useState(false);
    const [toast, setToast] = useState({
        show: false,
        message: "",
    });

    function showToast(message) {
        setToast({ show: true, message });

        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileObj(file);
        setFileName(file.name);
        setResultReady(false);
    };

    async function handleFormat(data) {
        try {
            if (!fileObj) {
                showToast("Спочатку завантаж файл");
                return;
            }

            setLoading(true);
            setResultReady(false);

            const formData = new FormData();

            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });

            formData.append("file", fileObj);

            const req = await fetch(
                "https://docformat-backend.fly.dev/api/document/format/",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!req.ok) {
                throw new Error("Не вдалося відформатувати документ");
            }

            const blob = await req.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download =
                data.outputFormat === "pdf"
                    ? "formatted-document.pdf"
                    : "formatted-document.docx";
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
            setResultReady(true);
        } catch (error) {
            console.error(error.message);
            alert("Сталася помилка при форматуванні");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-6">
            <div
                className={`fixed top-6 right-6 z-50 transform transition-all duration-500 
                ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}
            >
                <div className="rounded-xl bg-red-500 px-5 py-3 text-white shadow-lg">
                    {toast.message}
                </div>
            </div>
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-semibold text-slate-900">
                        Форматування документа
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Завантаж готовий DOCX, обери параметри оформлення і отримай
                        відформатований файл.
                    </p>
                </div>

                <form onSubmit={handleSubmit(handleFormat)}>
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr_280px]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Налаштування
                            </h2>

                            <div className="mt-4 space-y-3">

                                <select
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
                                    {...register("fontFamily")}
                                >
                                    <option value="Шрифт">Шрифт</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Calibri">Calibri</option>
                                </select>

                                <select
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
                                    {...register("fontSize")}
                                >
                                    <option value="Розмір шрифту">Розмір шрифту</option>
                                    <option value="12">12</option>
                                    <option value="14">14</option>
                                    <option value="16">16</option>
                                </select>

                                <select
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
                                    {...register("lineSpacing")}
                                >
                                    <option value="Відступ">Відступ</option>
                                    <option value="1">1.0</option>
                                    <option value="1.5">1.5</option>
                                    <option value="2">2.0</option>
                                </select>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-blue-500"
                                        {...register("pageNumbers")}
                                    />
                                    <span className="text-sm text-slate-700">
                                        Нумерація сторінок
                                    </span>
                                </label>

                                <select
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
                                    {...register("outputFormat")}
                                >
                                    <option value="docx">DOCX</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Завантаження документа
                            </h2>

                            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                <div className="mx-auto flex max-w-md flex-col items-center">
                                    <p className="text-base font-medium text-slate-800">
                                        Перетягни DOCX файл сюди
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        або обери файл вручну
                                    </p>

                                    <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                                        Обрати файл
                                        <input
                                            type="file"
                                            accept=".docx"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>

                                    <p className="mt-4 text-xs text-slate-500">
                                        Підтримуються файли .docx
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Інформація про файл
                                </h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    {fileName ? fileName : "Файл ще не вибрано"}
                                </p>
                            </div>

                            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Що буде відформатовано
                                </h3>
                                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                                    <li>Шрифт, розмір і міжрядковий інтервал</li>
                                    <li>Відступи, абзаци та поля сторінки</li>
                                    <li>Заголовки, вирівнювання та структура</li>
                                    <li>Нумерація сторінок і зміст</li>
                                </ul>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Дії</h2>

                            <div className="mt-4 space-y-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {loading ? "Форматується..." : "Відформатувати файл"}
                                </button>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-sm font-medium text-slate-800">Статус</p>
                                    <p className="mt-2 text-sm text-slate-600">
                                        {loading
                                            ? "Документ обробляється..."
                                            : resultReady
                                                ? "Готово до завантаження"
                                                : "Очікує завантаження файлу"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-sm font-medium text-slate-800">
                                        Результат
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Після обробки файл автоматично завантажиться на пристрій.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FormatDocument;