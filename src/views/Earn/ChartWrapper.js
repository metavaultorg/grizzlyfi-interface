
export default function ChartWrapper(props) {
  const { title, } = props;
  return (
    <>
      <h3>
        {title}
        {/* <CsvLink fields={csvFields} name={title} data={data} /> */}
      </h3>
      {props.children}
    </>
  );
}
