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
      const req = await fetch("http://localhost:80/api/title/generate/", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!req.ok) throw new Error("error posting data");
      const result = await req.json();
      console.log(result);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-100 p-4">
      <h1 className="font-semibold text-3xl mb-6">Створити титулку</h1>

      <div className="relative w-full max-w-200 aspect-[1/1.414] bg-white shadow-2xl overflow-hidden text-sm sm:text-base">
        {/* <img
          src=""
          alt="Title page background"
          className="absolute inset-0 w-full h-full object-contain opacity-50 z-0 pointer-events-none"
        /> */}

        <form
          className="w-full h-full relative z-10"
          onSubmit={handleSubmit((data) => handleForm(data))}
        >
          {/* ВЕРХНЯ ЧАСТИНА */}
          <input
            type="text"
            placeholder="university"
            className={`${paperInputStyles} top-[12%] left-1/2 -translate-x-1/2 text-center w-[80%] font-bold uppercase`}
            {...register("university")}
          />

          <input
            type="text"
            placeholder="faculty"
            className={`${paperInputStyles} top-[18%] right-[10%] text-right w-[40%]`}
            {...register("faculty")}
          />
          <input
            type="text"
            placeholder="department"
            className={`${paperInputStyles} top-[21%] right-[10%] text-right w-[40%]`}
            {...register("department")}
          />

          {/* --- ЛОГОТИП --- */}
          <div
            className="absolute top-[28%] left-1/2 -translate-x-1/2 w-24 h-24 border-2 border-dashed border-gray-300 rounded bg-white/50 hover:border-blue-500 hover:bg-white/80 transition-all group overflow-hidden"
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
            className={`${paperInputStyles} top-[35%] left-1/2 -translate-x-1/2 text-center w-[50%] font-bold cursor-pointer appearance-none`}
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

          <div className="absolute top-[39%] left-1/2 -translate-x-1/2 w-[70%] text-center">
            <span className="mr-2">з дисципліни</span>
            <input
              type="text"
              placeholder="discipline"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-[60%] font-semibold placeholder-gray-400/70"
              {...register("discipline")}
            />
          </div>

          <div className="absolute top-[43%] left-1/2 -translate-x-1/2 w-[80%] text-center">
            <span className="mr-2">на тему:</span>
            <input
              type="text"
              placeholder="topic"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-[70%] font-bold placeholder-gray-400/70"
              {...register("topic")}
            />
          </div>

          <div className="absolute top-[47%] left-1/2 -translate-x-1/2 w-[40%] text-center">
            <span className="mr-2">Варіант</span>
            <input
              type="text"
              placeholder="variant"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-[30%] font-semibold placeholder-gray-400/70"
              {...register("variant")}
            />
          </div>

          {/* НИЖНЯ ПРАВА ЧАСТИНА */}
          <div className="absolute top-[65%] right-[15%] w-[45%] text-left flex flex-col gap-1 pl-4">
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Виконав(-ла):</span>
              <div className="flex-1 flex gap-1">
                <span>студент(-ка) групи</span>
                <input
                  type="text"
                  placeholder="group"
                  className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-16 text-center font-semibold"
                  {...register("group")}
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="{{student_full_name}}"
              className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full font-semibold ml-25 -mt-1"
              {...register("studentFullName")}
            />

            <div className="mt-6 font-bold">Прийняв(-ла):</div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <input
                type="text"
                placeholder="teacher_degree"
                className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1 min-w-25 text-sm"
                {...register("teacherDegree")}
              />
              <input
                type="text"
                placeholder="teacher_role"
                className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1 min-w-25 text-sm"
                {...register("teacherRole")}
              />
            </div>
            <input
              type="text"
              placeholder="teacher_name"
              className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full mt-1 font-semibold"
              {...register("teacherName")}
            />
            <span className="text-[10px] text-center w-full block text-gray-500">
              (ініціали, прізвище)
            </span>
          </div>

          {/* НИЗ (Місто та рік) */}
          <input
            type="text"
            placeholder="city_and_year"
            className={`${paperInputStyles} bottom-[5%] left-1/2 -translate-x-1/2 text-center w-[40%] font-semibold`}
            {...register("CityAndName")}
          />
        </form>
      </div>

      {/* Налаштування поза аркушем */}
      <div className="mt-6 flex gap-4 bg-white p-4 rounded shadow z-20">
        <div className="flex items-center gap-2">
          <label htmlFor="language">Мова:</label>
          <select
            id="language"
            className="border rounded p-1 bg-white"
            {...register("language")}
          >
            <option value="ukr">Українська</option>
            <option value="eng">Англійська</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pageNumbers">Нумерація сторінок</label>
          <input
            type="checkbox"
            id="pageNumbers"
            className="w-5 h-5 accent-blue-500"
            {...register("pageNumbers")}
          />
        </div>
      </div>
    </div>
  );
}

export default FormatTitle;
