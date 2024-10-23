import { grabTest } from "./action";

export default function TestPage() {
  return (
    <div>
      <h1>Test Data</h1>
      <button onClick={grabTest}>CLICK</button>
    </div>
  );
}
