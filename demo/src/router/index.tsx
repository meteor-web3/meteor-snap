import React from "react";

import { createBrowserRouter } from "react-router-dom";

import Layout from "@/layout";
import { Home } from "@/pages/Home";
import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
