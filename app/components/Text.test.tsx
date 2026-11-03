import { render } from "@testing-library/react-native"

import { Text } from "./Text"

describe("Text", () => {
  it("renders the text prop", () => {
    const { getByText } = render(<Text text="Test string" />)
    expect(getByText("Test string")).toBeDefined()
  })

  it("renders children when no text prop is given", () => {
    const { getByText } = render(<Text>Child text</Text>)
    expect(getByText("Child text")).toBeDefined()
  })
})
