import Markdown from 'react-markdown';
import readme from '../../../../README.md?raw';

/** This is an example stub implementation. Please replace with your actual Home
 * component implementation.
 */
export default function Home() {
  return (
    <div>
      <Markdown>{readme}</Markdown>
    </div>
  );
}
