import { version } from '../constants/config'

const Header = () => (
  <div className="navigation-header">
        <a href="/">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZD0iTTMuMjYzIDE1LjU1N2MtLjYwNSAwLTEuMDk2LjUwNy0xLjA5NiAxLjEzMiAwIC42MjUuNDkgMS4xMzIgMS4wOTYgMS4xMzIuNjA1IDAgMS4wOTYtLjUwNyAxLjA5Ni0xLjEzMiAwLS42MjUtLjQ5LTEuMTMyLTEuMDk2LTEuMTMyek0xNS4zNDggMS44NzRjLS42MDUgMC0xLjA5Ni41MDctMS4wOTYgMS4xMzIgMCAuNjI1LjQ5IDEuMTMyIDEuMDk2IDEuMTMyLjYwNSAwIDEuMDk2LS41MDcgMS4wOTYtMS4xMzIgMC0uNjIzLS40ODgtMS4xMy0xLjA5Mi0xLjEzMmgtLjAwNHptLTcuOTMzIDQuNThWNy44NGMwIC4yMDguMTY0LjM3Ny4zNjYuMzc3aDEwLjg1NWMuMi0uMDAyLjM2MS0uMTcuMzYxLS4zNzdWNi40NTRhLjM3MS4zNzEgMCAwIDAtLjM2NS0uMzc3SDcuNzc2YS4zNzIuMzcyIDAgMCAwLS4zNjMuMzc3aC4wMDJ6bTQuMTc1IDYuNHYtMS4zODJhLjM3Mi4zNzIgMCAwIDAtLjM2NS0uMzc3SC4zN2EuMzcxLjM3MSAwIDAgMC0uMzcuMzczdjEuMzg3YzAgLjIwOC4xNjQuMzc3LjM2NS4zNzdoMTAuODU2YS4zNzEuMzcxIDAgMCAwIC4zNy0uMzczdi0uMDA0em03LjMzNC0xLjg1NmEuMzU5LjM1OSAwIDAgMC0uMjQ4LS4xNDJsLTEuMzM0LS4xNGEuMzY2LjM2NiAwIDAgMC0uMzk5LjMyNWMtLjU2MyA0LjMwMy00LjM5NiA3LjMyLTguNTYyIDYuNzRhNy40MSA3LjQxIDAgMCAxLTEuNjg2LS40NDMuMzU4LjM1OCAwIDAgMC0uNDY2LjIxNmwtLjUxNSAxLjI3OGEuMzguMzggMCAwIDAgLjIwOS40OTljNC45ODggMS45ODIgMTAuNTg4LS41ODggMTIuNTA3LTUuNzQxLjI3OC0uNzQ3LjQ2OS0xLjUyNS41NjctMi4zMThhLjM4LjM4IDAgMCAwLS4wNzMtLjI3NHpNLjA4IDcuODAyYS4zODQuMzg0IDAgMCAxLS4wNDQtLjI5MUMxLjEzNSAzLjA5MyA0Ljk5LjAwMyA5LjQwNyAwYTkuMzY3IDkuMzY3IDAgMCAxIDMuMTguNTUyLjM4OC4zODggMCAwIDEgLjIyMy40OTFsLS40NzQgMS4yOTVhLjM2LjM2IDAgMCAxLS40Ni4yMTUgNy4zNzYgNy4zNzYgMCAwIDAtMi40Ny0uNDMxIDcuMzcgNy4zNyAwIDAgMC00Ljc3MSAxLjc2QTcuOTMyIDcuOTMyIDAgMCAwIDIuMDUgOC4wMDlhLjM1OS4zNTkgMCAwIDEtLjQzNC4yNzJMLjMwOSA3Ljk3OWEuMzYzLjM2MyAwIDAgMS0uMjMtLjE3N3oiIGZpbGw9IiM1MEI2OEMiIC8+Cjwvc3ZnPgo=" alt="Segment" />
        </a>
        <div style={{flex:"2", marginLeft:"12px", fontSize: "16px", fontWeight: 600}}>Event Generator (v{version})</div>
        <div className="navigation-right" style={{flex: "1"}}>
          <div className="navigation-header-tab"><a rel="noreferrer" target="_blank" href="https://docs.google.com/spreadsheets/d/1QpgfIq1VgGBy9iMNekSR80J2JHCmDaAPwEUH8_NDWcA/edit#gid=934482474">Templates</a></div>
          <div className="navigation-header-tab"><a rel="noreferrer" target="_blank" href="https://segment.atlassian.net/wiki/spaces/SOLENG/pages/1904738629/Event+Generator+Formerly+Demo+Generator+2.0">Documentation</a></div>
          <div className="navigation-header-tab"><a rel="noreferrer" target="_blank" href="https://docs.google.com/spreadsheets/d/1zYPYBais9JLmO4XukU6_GQ6ltg-Uofcq0IbUjLb08rI/edit?usp=sharing">Share</a></div>
          <div className="navigation-header-tab"><a rel="noreferrer" target="_blank" href="https://github.com/send-on/new-demo-generator">Github</a></div>
        </div>
      </div>

)

export default Header