import { createBrowserRouter, RouterProvider } from "react-router";
import AppLayout from "./ui/AppLayout";
import FormatTitle from "./pages/FormatTitle";
import Format from "./pages/Format";
import Docs from "./pages/Docs";
import Privacy from "./pages/Privacy";
import MainPage from "./pages/MainPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/home",
        element: <MainPage />
      },
      {
        path: "/format/title",
        element: <FormatTitle />,
      },
      {
        path: "/format",
        element: <Format />,
      },
      {
        path: "/docs",
        element: <Docs />,
      },
      {
        path: "/privacy",
        element: <Privacy />,
      }
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
