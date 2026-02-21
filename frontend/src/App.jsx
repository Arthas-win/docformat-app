import { createBrowserRouter, RouterProvider } from "react-router";
import AppLayout from "./ui/AppLayout";
import FormatTitle from "./pages/FormatTitle";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/home",
      },
      {
        path: "/format/title",
        element: <FormatTitle />,
      },
      {
        path: "/format/style",
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
