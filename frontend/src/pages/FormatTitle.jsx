import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { paperInputStyles } from "../styles/styles";
import Nulp_logo_ukr from "../assets/Nulp_logo_ukr.jpg";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TITLE_GENERATE_URL = `${API_BASE_URL}/api/title/generate/`;
const TITLE_JOB_POLL_INTERVAL_MS = 1000;
const TITLE_JOB_POLL_ATTEMPTS = 20;

function FormatTitle() {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      university: "",
      faculty: "",
      department: "",
      workType: "",
      discipline: "",
      topic: "",
      variant: "",
      group: "",
      studentFullName: "",
      teacherDegree: "",
      teacherRole: "",
      teacherName: "",
      cityAndYear: "",
      language: "ukr",
      pageNumbers: false,
    },
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const formValues = watch();

  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, [logoUrl]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (logoUrl) URL.revokeObjectURL(logoUrl);

    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  };

  const normalizedUniversity = formValues.university.trim().toLowerCase();

  const universityLogo =
    normalizedUniversity === "львівська політехніка" ? Nulp_logo_ukr : null;

  const universityText = {
    "Львівська політехніка":
      "МІНІСТЕРСТВО ОСВІТИ І НАУКИ УКРАЇНИ\nНАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ «ЛЬВІВСЬКА ПОЛІТЕХНІКА»",
  };

  const universityTitle = universityText[formValues.university];

  const pollTitleJob = async (jobId) => {
    for (let attempt = 0; attempt < TITLE_JOB_POLL_ATTEMPTS; attempt += 1) {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/`);
      if (!response.ok) {
        throw new Error("Не вдалося перевірити статус генерації");
      }

      const job = await response.json();
      if (job.status === "DONE") {
        return job;
      }
      if (job.status === "FAILED") {
        throw new Error(
          job.error_text || "Генерація документа завершилась з помилкою",
        );
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, TITLE_JOB_POLL_INTERVAL_MS);
      });
    }

    throw new Error("Генерація триває занадто довго. Спробуй ще раз.");
  };

  const downloadTitleFile = async (jobId) => {
    const downloadResponse = await fetch(
      `${API_BASE_URL}/api/jobs/${jobId}/download/`,
    );

    if (!downloadResponse.ok) {
      throw new Error("Не вдалося скачати готовий файл");
    }

    const blob = await downloadResponse.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `title-${jobId}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  async function handleForm(data) {
    try {
      setLoading(true);
      setSubmitError("");
      setSubmitMessage("Надсилаю дані на генерацію...");

      const formData = new FormData();

      const isNulp = data.university === "Львівська політехніка";

      const finalUniversity = isNulp
        ? "МІНІСТЕРСТВО ОСВІТИ І НАУКИ УКРАЇНИ\nНАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ «ЛЬВІВСЬКА ПОЛІТЕХНІКА»"
        : data.university;

      Object.entries(data).forEach(([key, value]) => {
        if (key !== "logo" && key !== "university") {
          formData.append(key, value);
        }
      });

      formData.append("university", finalUniversity);

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (isNulp) {
        const staticLogoFile = await getStaticLogoFile();
        formData.append("logo", staticLogoFile);
      }

      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const req = await fetch(TITLE_GENERATE_URL, {
        method: "POST",
        body: formData,
      });

      if (!req.ok) {
        let details = "";
        try {
          const errorBody = await req.json();
          if (typeof errorBody === "string") {
            details = errorBody;
          } else if (errorBody?.detail) {
            details = errorBody.detail;
          } else {
            details = Object.entries(errorBody || {})
              .map(([key, value]) => {
                const message = Array.isArray(value)
                  ? value.join(", ")
                  : String(value);
                return `${key}: ${message}`;
              })
              .join("; ");
          }
        } catch {
          details = "";
        }

        throw new Error(
          details || `Помилка при відправці форми (HTTP ${req.status})`,
        );
      }

      const result = await req.json();
      setSubmitMessage("Документ генерується...");

      if (result.file_url) {
        await downloadTitleFile(result.job_id);
        setSubmitMessage("Файл успішно згенеровано і скачано.");
        return;
      }

      await pollTitleJob(result.job_id);
      setSubmitMessage("Документ готовий. Завантажую файл...");
      await downloadTitleFile(result.job_id);
      setSubmitMessage("Файл успішно згенеровано і скачано.");
    } catch (error) {
      setSubmitError(error.message || "Не вдалося згенерувати титулку");
    } finally {
      setLoading(false);
    }
  }

  async function getStaticLogoFile() {
    const response = await fetch(Nulp_logo_ukr);
    const blob = await response.blob();
    return new File([blob], "Nulp_logo_ukr.jpg", { type: blob.type });
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">
            Створити титулку
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Заповни поля зліва, а справа одразу дивись прев'ю титульної
            сторінки.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleForm)}>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Основні дані
                  </h2>
                  <div className="mt-4 space-y-3">
                    <select
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 bg-white"
                      {...register("university")}
                    >
                      <option value="">Університет</option>
                      <option value="Львівська політехніка">
                        Львівська політехніка
                      </option>
                      <option value="Львівський національний університет ім. Івана Франка">
                        Львівський національний університет ім. Івана Франка
                      </option>
                      <option value="...">Незабаром буде більше :3</option>
                    </select>

                    <select
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 bg-white"
                      {...register("faculty")}
                    >
                      <option value="">Інститут</option>
                      <option value="ІКТА">ІКТА</option>
                      <option value="ІКНІ">ІКНІ</option>
                      <option value="ІТРЕЕ">ІТРЕЕ</option>
                      <option value="ІЕСК">ІЕСК</option>
                      <option value="ІМІТ">ІМІТ</option>
                      <option value="ІБІД">ІБІД</option>
                      <option value="ІГДГ">ІГДГ</option>
                      <option value="ІАРД">ІАРД</option>
                      <option value="ІППТ">ІППТ</option>
                      <option value="ІХХТ">ІХХТ</option>
                      <option value="ІМФН">ІМФН</option>
                      <option value="ІГСН">ІГСН</option>
                      <option value="ІППО">ІППО</option>
                      <option value="ІПМТ">ІПМТ</option>
                      <option value="ІАДУ">ІАДУ</option>
                      <option value="ІСД">ІСД</option>
                      <option value="ІДН">ІДН</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Кафедра"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("department")}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Параметри роботи
                  </h2>
                  <div className="mt-4 space-y-3">
                    <select
                      className="w-full rounded-xl border border-slate-300 px-4  py-2.5 outline-none focus:border-blue-500 bg-white"
                      {...register("workType")}
                    >
                      <option value="">Тип роботи</option>
                      <option value="до лабораторної роботи">
                        Лабораторна робота
                      </option>
                      <option value="до курсової робота">Курсова робота</option>
                      <option value="до бакалаврської роботи">
                        Бакалаврська робота
                      </option>
                    </select>

                    <input
                      type="text"
                      placeholder="Дисципліна"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("discipline")}
                    />
                    <input
                      type="text"
                      placeholder="Тема"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("topic")}
                    />
                    <input
                      type="text"
                      placeholder="Варіант"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("variant")}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Студент і викладач
                  </h2>
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Група"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("group")}
                    />
                    <input
                      type="text"
                      placeholder="ПІБ студента"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("studentFullName")}
                    />
                    <input
                      type="text"
                      placeholder="Науковий ступінь викладача"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("teacherDegree")}
                    />
                    <input
                      type="text"
                      placeholder="Посада викладача"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("teacherRole")}
                    />
                    <input
                      type="text"
                      placeholder="ПІБ викладача"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("teacherName")}
                    />
                    <input
                      type="text"
                      placeholder="Місто і рік"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                      {...register("cityAndYear")}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Логотип і додатково
                  </h2>

                  <div className="mt-4 space-y-4">
                    <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-blue-500 hover:bg-slate-100">
                      <span className="text-sm font-medium text-slate-700">
                        Завантажити логотип
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        PNG / JPG
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Генерується..." : "Згенерувати титулку"}
                </button>
                {submitMessage ? (
                  <p className="text-sm text-slate-600">{submitMessage}</p>
                ) : null}
                {submitError ? (
                  <p className="text-sm text-red-600">{submitError}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Вигляд готової титулки
                </h2>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="xl:hidden flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.28 11.47a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H10.5a.75.75 0 0 1 0-1.5h3.75l-.97-.97a.75.75 0 0 1 0-1.06ZM6.72 8.53a.75.75 0 0 1-1.06 0L3.41 6.28a.75.75 0 0 1 0-1.06C3.55 5.08 3.7 4.93 3.94 4.78a.75.75 0 0 1 1.06 0l.97.97H9.5a.75.75 0 0 1 0 1.5H5.75l.97.97a.75.75 0 0 1 0 1.06Z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M4.75 1.5a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5H7a.75.75 0 0 0 0-1.5H4.75Zm10.5 0a.75.75 0 0 0-.75.75v1.5A.75.75 0 0 0 16 3h1.5a.75.75 0 0 0 0-1.5h-2.25Zm0 17a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75Zm-10.5 0a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5H7a.75.75 0 0 1 0 1.5H4.75Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  На весь екран
                </button>
              </div>

              {/* Звичайне прев'ю (видно тільки на великих екранах) */}
              <div className="hidden xl:flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-2 sm:p-4 justify-center">
                <div className="@container relative shrink-0 w-150 aspect-[1/1.4142] bg-white shadow-xl overflow-hidden text-[2cqi]">
                  <div
                    className={`${paperInputStyles} top-[5%] left-1/2 -translate-x-1/2 text-center w-[80%] font-bold uppercase whitespace-pre-line`}
                  >
                    {universityTitle ? universityTitle : formValues.university}
                  </div>

                  <input
                    type="text"
                    readOnly
                    value={formValues.faculty || ""}
                    placeholder="faculty"
                    className={`${paperInputStyles} top-[10%] right-[10%] text-right w-[40%] text-[2cqi]`}
                  />

                  <input
                    type="text"
                    readOnly
                    value={formValues.department || ""}
                    placeholder="department"
                    className={`${paperInputStyles} top-[13%] right-[10%] text-right w-[40%] text-[2cqi]`}
                  />

                  <div className="absolute top-[17%] left-1/2 -translate-x-1/2 w-[22%] aspect-square border-2 border-dashed border-gray-300 rounded bg-white overflow-hidden">
                    {universityLogo ? (
                      <img
                        src={universityLogo}
                        className="w-full h-full object-contain"
                      />
                    ) : logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[1.5cqi] text-slate-400">
                        logo
                      </div>
                    )}
                  </div>

                  <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[40%] text-center">
                    <span className="mr-2 text-[2.75cqi] font-bold tracking-widest">
                      З В І Т
                    </span>
                  </div>

                  <input
                    type="text"
                    readOnly
                    value={formValues.workType || ""}
                    placeholder="work_type"
                    className={`${paperInputStyles} top-[45%] left-1/2 -translate-x-1/2 text-center w-[50%] text-[2cqi]`}
                  />

                  <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[70%] text-center">
                    <span className="mr-[1cqi] font-bold">з дисципліни</span>
                    <span>{formValues.discipline || "discipline"}</span>
                  </div>

                  <div className="absolute top-[51%] left-1/2 -translate-x-1/2 w-[80%] text-center">
                    <span className="mr-[1cqi] font-bold">на тему:</span>
                    <span>{formValues.topic || "topic"}</span>
                  </div>

                  <div className="absolute top-[54%] left-1/2 -translate-x-1/2 w-[40%] text-center">
                    <span className="mr-[1cqi] font-semibold">Варіант №</span>
                    <span className="font-semibold">
                      {formValues.variant || "variant"}
                    </span>
                  </div>

                  <div className="absolute top-[65%] right-[5%] w-[42%] text-left flex flex-col gap-[0.5cqi] pl-[2cqi]">
                    <div className="font-bold">Виконав(-ла):</div>
                    <div>студент(-ка) групи {formValues.group || "group"}</div>
                    <div className="font-semibold">
                      {formValues.studentFullName || "student_full_name"}
                    </div>

                    <div className="mt-[2cqi] font-bold">Прийняв(-ла):</div>
                    <div>
                      {formValues.teacherDegree || "teacher_degree"}{" "}
                      {formValues.teacherRole || "teacher_role"}
                    </div>
                    <div className="font-semibold">
                      {formValues.teacherName || "teacher_name"}
                    </div>
                  </div>

                  <input
                    type="text"
                    readOnly
                    value={formValues.cityAndYear || ""}
                    placeholder="city_and_year"
                    className={`${paperInputStyles} bottom-[5%] left-1/2 -translate-x-1/2 text-center w-[40%] font-semibold text-[2cqi]`}
                  />
                </div>
              </div>

              {/* Прев'ю на мобільних пристроях (кнопка-заглушка замість величезного скролу) */}
              <div
                className="xl:hidden flex flex-col items-center justify-center rounded-2xl bg-slate-100 p-8 border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-200 transition"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-12 h-12 text-slate-400 mb-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <p className="text-center font-medium text-slate-700">
                  Натисни, щоб подивитися прев'ю
                </p>
                <p className="text-center text-sm text-slate-500 mt-1">
                  Відкриється на весь екран
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Модальне вікно для прев'ю титулки на мобільних */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm p-4 xl:hidden">
          <div className="flex justify-between items-center bg-white rounded-t-2xl px-4 py-3 border-b">
            <h3 className="font-semibold text-slate-900">Прев'ю титулки</h3>
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 bg-slate-100 overflow-auto rounded-b-2xl p-4 flex justify-center">
            <div className="@container relative shrink-0 w-150 aspect-[1/1.4142] bg-white shadow-xl overflow-hidden text-[2cqi] origin-top">
              <div
                className={`${paperInputStyles} top-[5%] left-1/2 -translate-x-1/2 text-center w-[80%] font-bold uppercase whitespace-pre-line`}
              >
                {universityTitle ? universityTitle : formValues.university}
              </div>

              <input
                type="text"
                readOnly
                value={formValues.faculty || ""}
                placeholder="faculty"
                className={`${paperInputStyles} top-[10%] right-[10%] text-right w-[40%] text-[2cqi]`}
              />

              <input
                type="text"
                readOnly
                value={formValues.department || ""}
                placeholder="department"
                className={`${paperInputStyles} top-[13%] right-[10%] text-right w-[40%] text-[2cqi]`}
              />

              <div className="absolute top-[17%] left-1/2 -translate-x-1/2 w-[22%] aspect-square border-2 border-dashed border-gray-300 rounded bg-white overflow-hidden">
                {universityLogo ? (
                  <img
                    src={universityLogo}
                    className="w-full h-full object-contain"
                  />
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[1.5cqi] text-slate-400">
                    logo
                  </div>
                )}
              </div>

              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[40%] text-center">
                <span className="mr-2 text-[2.75cqi] font-bold tracking-widest">
                  З В І Т
                </span>
              </div>

              <input
                type="text"
                readOnly
                value={formValues.workType || ""}
                placeholder="work_type"
                className={`${paperInputStyles} top-[45%] left-1/2 -translate-x-1/2 text-center w-[50%] text-[2cqi]`}
              />

              <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[70%] text-center">
                <span className="mr-[1cqi] font-bold">з дисципліни</span>
                <span>{formValues.discipline || "discipline"}</span>
              </div>

              <div className="absolute top-[51%] left-1/2 -translate-x-1/2 w-[80%] text-center">
                <span className="mr-[1cqi] font-bold">на тему:</span>
                <span>{formValues.topic || "topic"}</span>
              </div>

              <div className="absolute top-[54%] left-1/2 -translate-x-1/2 w-[40%] text-center">
                <span className="mr-[1cqi] font-semibold">Варіант №</span>
                <span className="font-semibold">
                  {formValues.variant || "variant"}
                </span>
              </div>

              <div className="absolute top-[65%] right-[5%] w-[42%] text-left flex flex-col gap-[0.5cqi] pl-[2cqi]">
                <div className="font-bold">Виконав(-ла):</div>
                <div>студент(-ка) групи {formValues.group || "group"}</div>
                <div className="font-semibold">
                  {formValues.studentFullName || "student_full_name"}
                </div>

                <div className="mt-[2cqi] font-bold">Прийняв(-ла):</div>
                <div>
                  {formValues.teacherDegree || "teacher_degree"}{" "}
                  {formValues.teacherRole || "teacher_role"}
                </div>
                <div className="font-semibold">
                  {formValues.teacherName || "teacher_name"}
                </div>
              </div>

              <input
                type="text"
                readOnly
                value={formValues.cityAndYear || ""}
                placeholder="city_and_year"
                className={`${paperInputStyles} bottom-[5%] left-1/2 -translate-x-1/2 text-center w-[40%] font-semibold text-[2cqi]`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormatTitle;
