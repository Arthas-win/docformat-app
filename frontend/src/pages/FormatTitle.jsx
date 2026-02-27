import { useState } from "react";
import { useForm } from "react-hook-form";

import { paperInputStyles } from "../styles/styles";

function FormatTitle() {
  const { register, handleSubmit } = useForm();

  const [logoUrl, setLogoUrl] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setLogoUrl(imageUrl);
    }
  };

  async function handleForm(data) {
    try {
      if (!data) throw new Error("something wrong with data");
      const req = await fetch(
        "https://docformat-backend.fly.dev/api/title/generate/",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!req.ok) throw new Error("error posting data");
      const result = await req.json();
      console.log(result);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-100 p-2 sm:p-4">
      <h1 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6 text-center">
        Створити титулку
      </h1>

      <div className="relative w-full max-w-105 sm:max-w-150 md:max-w-175 aspect-[1/1.414] bg-white shadow-2xl overflow-hidden text-xs sm:text-sm md:text-base rounded-lg transition-all">
        {/* <img
          src=""
          alt="Title page background"
          className="absolute inset-0 w-full h-full object-contain opacity-50 z-0 pointer-events-none"
        /> */}

        <form
          className="w-full h-full relative z-10"
          onSubmit={handleSubmit((data) => handleForm(data))}
          autoComplete="off"
        >
          {/* ВЕРХНЯ ЧАСТИНА */}
          <input
            type="text"
            placeholder="university"
            className={`${paperInputStyles} top-[10%] sm:top-[12%] left-1/2 -translate-x-1/2 text-center w-[90%] sm:w-[80%] font-bold uppercase text-xs sm:text-base`}
            {...register("university")}
          />

          <input
            type="text"
            placeholder="faculty"
            className={`${paperInputStyles} top-[16%] sm:top-[18%] right-[5%] sm:right-[10%] text-right w-[60%] sm:w-[40%]`}
            {...register("faculty")}
          />
          <input
            type="text"
            placeholder="department"
            className={`${paperInputStyles} top-[20%] sm:top-[21%] right-[5%] sm:right-[10%] text-right w-[60%] sm:w-[40%]`}
            {...register("department")}
          />

          {/* --- ЛОГОТИП --- */}
          <div
            className="absolute top-[18%] sm:top-[28%] left-1/2 -translate-x-1/2 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 aspect-square border-2 border-dashed border-gray-300 rounded bg-white/50 hover:border-blue-500 hover:bg-white/80 transition-all group overflow-hidden"
            title="Натисніть, щоб завантажити логотип"
          >
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-1">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                {...register("logo")}
              />
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <>
                  <span className="font-bold text-xs text-gray-400 group-hover:text-blue-500">
                    {"{{ logo }}"}
                  </span>
                  <span className="text-[10px] mt-1 text-gray-400 group-hover:text-blue-500 hidden sm:block">
                    Завантажити
                  </span>
                </>
              )}
            </label>
          </div>

          {/* ЦЕНТРАЛЬНА ЧАСТИНА */}
          <select
            className={`${paperInputStyles} top-[38%] sm:top-[35%] left-1/2 -translate-x-1/2 text-center w-[70%] sm:w-[50%] font-bold cursor-pointer appearance-none text-xs sm:text-base`}
            style={{ textAlignLast: "center" }}
            defaultValue=""
            {...register("workType")}
          >
            <option value="" disabled className="text-gray-400">
              {" work_type "}
            </option>
            <option value="lab">Лабораторна робота</option>
            <option value="term">Курсова робота</option>
            <option value="report">Реферат</option>
            <option value="bachelor">Бакалаврська робота</option>
          </select>

          <div className="absolute top-[37%] sm:top-[39%] left-1/2 -translate-x-1/2 w-[90%] sm:w-[70%] text-center">
            <span className="mr-2">з дисципліни</span>
            <input
              type="text"
              placeholder="discipline"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-[80%] sm:w-[60%] font-semibold placeholder-gray-400/70 text-xs sm:text-base"
              {...register("discipline")}
            />
          </div>

          <div className="absolute top-[41%] sm:top-[43%] left-1/2 -translate-x-1/2 w-[95%] sm:w-[80%] text-center">
            <span className="mr-2">на тему:</span>
            <input
              type="text"
              placeholder="topic"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-[90%] sm:w-[70%] font-bold placeholder-gray-400/70 text-xs sm:text-base"
              {...register("topic")}
            />
          </div>

          <div className="absolute top-[45%] sm:top-[47%] left-1/2 -translate-x-1/2 w-[60%] sm:w-[40%] text-center">
            <span className="mr-2">Варіант</span>
            <input
              type="text"
              placeholder="variant"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-[50%] sm:w-[30%] font-semibold placeholder-gray-400/70 text-xs sm:text-base"
              {...register("variant")}
            />
          </div>

          {/* НИЖНЯ ПРАВА ЧАСТИНА */}
          <div className="absolute top-[60%] sm:top-[65%] right-[2%] sm:right-[15%] w-[80%] sm:w-[45%] text-left flex flex-col gap-1 pl-2 sm:pl-4">
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Виконав(-ла):</span>
              <div className="flex-1 flex gap-1">
                <span>студент(-ка) групи</span>
                <input
                  type="text"
                  placeholder="group"
                  className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-12 sm:w-16 text-center font-semibold text-xs sm:text-base"
                  {...register("group")}
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="{{student_full_name}}"
              className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full font-semibold ml-0 sm:ml-25 -mt-1 text-xs sm:text-base"
              {...register("studentFullName")}
            />

            <div className="mt-4 sm:mt-6 font-bold">Прийняв(-ла):</div>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <input
                type="text"
                placeholder="teacher_degree"
                className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1 min-w-20 sm:min-w-25 text-xs sm:text-sm"
                {...register("teacherDegree")}
              />
              <input
                type="text"
                placeholder="teacher_role"
                className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1 min-w-20 sm:min-w-25 text-xs sm:text-sm"
                {...register("teacherRole")}
              />
            </div>
            <input
              type="text"
              placeholder="teacher_name"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full mt-1 font-semibold text-xs sm:text-base"
              {...register("teacherName")}
            />
            <span className="text-[9px] sm:text-[10px] text-center w-full block text-gray-500">
              (ініціали, прізвище)
            </span>
          </div>

          {/* НИЗ (Місто та рік) */}
          <input
            type="text"
            placeholder="city_and_year"
            className={`${paperInputStyles} bottom-[3%] sm:bottom-[5%] left-1/2 -translate-x-1/2 text-center w-[60%] sm:w-[40%] font-semibold text-xs sm:text-base`}
            {...register("CityAndName")}
          />
        </form>
      </div>

      {/* Налаштування поза аркушем */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white p-2 sm:p-4 rounded shadow z-20 w-full max-w-105 sm:max-w-150 md:max-w-175">
        <div className="flex items-center gap-1 sm:gap-2">
          <label htmlFor="language" className="text-xs sm:text-base">
            Мова:
          </label>
          <select
            id="language"
            className="border rounded p-1 bg-white text-xs sm:text-base"
            {...register("language")}
          >
            <option value="ukr">Українська</option>
            <option value="eng">Англійська</option>
          </select>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <label htmlFor="pageNumbers" className="text-xs sm:text-base">
            Нумерація сторінок
          </label>
          <input
            type="checkbox"
            id="pageNumbers"
            className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-500"
            {...register("pageNumbers")}
          />
        </div>
      </div>
    </div>
  );
}

export default FormatTitle;
