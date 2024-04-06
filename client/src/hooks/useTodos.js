import { useState, useEffect } from "react";
import { useAuthToken } from "../AuthTokenContext";

// this is a custom hook that fetches the todos items from the API
// custom hooks are a way to share logic between components
export default function useTodos() {
  const [todosItems, setTodosItems] = useState([]);
  const { accessToken } = useAuthToken();

  useEffect(() => {
    async function getTodosFromApi() {
      // fetch the todos from the API, passing the access token in the Authorization header
      const data = await fetch(`${process.env.REACT_APP_API_URL}/todos`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const todos = await data.json();

      setTodosItems(todos);
    }

    if (accessToken) {
      getTodosFromApi();
    }
  }, [accessToken]);

  return [todosItems, setTodosItems];
}
