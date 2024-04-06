import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import Todos from "../components/Todos";
import { useAuthToken } from "../AuthTokenContext";

jest.mock("../AuthTokenContext");

describe("Todos Component Tests", () => {
  beforeEach(() => {
    useAuthToken.mockReturnValue({ accessToken: "fake-token" });
    global.fetch = jest.fn((url, options) => {
      if (
        url === `${process.env.REACT_APP_API_URL}/todos` &&
        options.method !== "POST"
      ) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, title: "Todo 1", completed: false },
              { id: 2, title: "Todo 2", completed: true },
            ]),
        });
      }

      if (
        url === `${process.env.REACT_APP_API_URL}/todos` &&
        options.method === "POST"
      ) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ id: 3, title: "Todo 3", completed: false }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders and interacts correctly", async () => {
    render(<Todos />);

    await waitFor(() => {
      expect(screen.getByText("Todo 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Todo 2")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Todo 3" },
    });
    fireEvent.click(screen.getByText("+ Add Item"));

    await waitFor(() => {
      expect(screen.getByText("Todo 3")).toBeInTheDocument();
    });
  });
});
