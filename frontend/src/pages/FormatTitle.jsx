import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { paperInputStyles } from "../styles/styles";
import Nulp_logo_ukr from "../assets/Nulp_logo_ukr.jpg"

const API_BASE_URL = "https://docformat-backend.fly.dev";
const TITLE_GENERATE_URL = `${API_BASE_URL}/api/title/generate/`;
const TITLE_JOB_POLL_INTERVAL_MS = 1000;
const TITLE_JOB_POLL_ATTEMPTS = 20;

function FormatTitle() {
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
    normalizedUniversity === "львівська політехніка"
      ? Nulp_logo_ukr
      : null;


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
        throw new Error(job.error_text || "Генерація документа завершилась з помилкою");
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, TITLE_JOB_POLL_INTERVAL_MS);
      });
    }

    throw new Error("Генерація триває занадто довго. Спробуй ще раз.");
  };

  const downloadTitleFile = async (jobId) => {
    const downloadResponse = await fetch(
      `${API_BASE_URL}/api/jobs/${jobId}/download/`
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
        throw new Error("Помилка при відправці форми");
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
            Заповни поля зліва, а справа одразу дивись прев’ю титульної сторінки.
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
                      <option value="Львівська політехніка">Львівська політехніка</option>
                      <option value="Львіський національний університет ім. Івана Франка">Львіський національний університет ім. Івана Франка</option>
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
                      <option value="до лабораторної роботи">Лабораторна робота</option>
                      <option value="до курсової робота">Курсова робота</option>
                      <option value="до бакалаврської роботи">Бакалаврська робота</option>
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
              </div>

              <div className="flex justify-center overflow-auto rounded-2xl bg-slate-100 p-4">
                <div className="relative w-full max-w-[820px] aspect-[1/1.414] bg-white shadow-xl overflow-hidden text-sm sm:text-base">

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
                    className={`${paperInputStyles} top-[10%] right-[10%] text-right w-[40%]`}
                  />

                  <input
                    type="text"
                    readOnly
                    value={formValues.department || ""}
                    placeholder="department"
                    className={`${paperInputStyles} top-[13%] right-[10%] text-right w-[40%]`}
                  />

                  <div className="absolute top-[17%] left-1/2 -translate-x-1/2 w-65 h-65 border-2 border-dashed border-gray-300 rounded bg-white overflow-hidden">
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
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        logo
                      </div>
                    )}
                  </div>

                  <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[40%] text-center">
                    <span className="mr-2 text-sm font-bold">З В І Т</span>
                  </div>

                  <input
                    type="text"
                    readOnly
                    value={formValues.workType || ""}
                    placeholder="work_type"
                    className={`${paperInputStyles} top-[45%] left-1/2 -translate-x-1/2 text-center w-[50%]`}
                  />

                  <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[70%] text-center">
                    <span className="mr-2 font-bold">з дисципліни</span>
                    <span>
                      {formValues.discipline || "discipline"}
                    </span>
                  </div>

                  <div className="absolute top-[51%] left-1/2 -translate-x-1/2 w-[80%] text-center">
                    <span className="mr-2 font-bold">на тему:</span>
                    <span>
                      {formValues.topic || "topic"}
                    </span>
                  </div>

                  <div className="absolute top-[54%] left-1/2 -translate-x-1/2 w-[40%] text-center">
                    <span className="mr-2 font-semibold">Варіант №</span>
                    <span className="font-semibold">
                      {formValues.variant || "variant"}
                    </span>
                  </div>

                  <div className="absolute top-[65%] right-[0%] w-[33%] text-left flex flex-col gap-1 pl-4">
                    <div className="font-bold">Виконав(-ла):</div>
                    <div>
                      студент(-ка) групи {formValues.group || "group"}
                    </div>
                    <div className="font-semibold">
                      {formValues.studentFullName || "student_full_name"}
                    </div>

                    <div className="mt-6 font-bold">Прийняв(-ла):</div>
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
                    className={`${paperInputStyles} bottom-[5%] left-1/2 -translate-x-1/2 text-center w-[40%] font-semibold`}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormatTitle;
