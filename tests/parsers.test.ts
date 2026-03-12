import { DartParser } from '../src/parsers/dart';
import { DotnetParser } from '../src/parsers/dotnet';
import { GoParser } from '../src/parsers/go';
import { JavaParser } from '../src/parsers/java';
import { NodeParser } from '../src/parsers/node';
import { PhpParser } from '../src/parsers/php';
import { PythonParser } from '../src/parsers/python';
import { RubyParser } from '../src/parsers/ruby';
import { RustParser } from '../src/parsers/rust';

describe('manifest parsers', () => {
  it('parses python requirements', () => {
    const parser = new PythonParser();
    expect(parser.parse('requirements.txt', 'flask==2.3.2\nrequests==2.31.0')).toHaveLength(2);
  });

  it('parses node package.json', () => {
    const parser = new NodeParser();
    const deps = parser.parse('package.json', JSON.stringify({ dependencies: { express: '4.21.2' } }));
    expect(deps[0]).toMatchObject({ name: 'express', version: '4.21.2', ecosystem: 'npm' });
  });

  it('parses go.mod', () => {
    const parser = new GoParser();
    const deps = parser.parse('go.mod', 'require (\n github.com/gin-gonic/gin v1.9.1\n)');
    expect(deps[0]).toMatchObject({ name: 'github.com/gin-gonic/gin', version: '1.9.1' });
  });

  it('parses Cargo.toml', () => {
    const parser = new RustParser();
    const deps = parser.parse('Cargo.toml', '[dependencies]\nserde = "1.0.210"');
    expect(deps[0]).toMatchObject({ name: 'serde', version: '1.0.210' });
  });

  it('parses Gemfile', () => {
    const parser = new RubyParser();
    const deps = parser.parse('Gemfile', 'gem "rails", "7.1.3"');
    expect(deps[0]).toMatchObject({ name: 'rails', version: '7.1.3' });
  });

  it('parses composer.json', () => {
    const parser = new PhpParser();
    const deps = parser.parse('composer.json', JSON.stringify({ require: { monolog: '3.5.0' } }));
    expect(deps[0]).toMatchObject({ name: 'monolog', version: '3.5.0' });
  });

  it('parses pom.xml', () => {
    const parser = new JavaParser();
    const deps = parser.parse(
      'pom.xml',
      '<project><dependencies><dependency><groupId>org.springframework</groupId><artifactId>spring-core</artifactId><version>6.1.5</version></dependency></dependencies></project>'
    );
    expect(deps[0]).toMatchObject({ name: 'org.springframework:spring-core', version: '6.1.5' });
  });

  it('parses pubspec.yaml', () => {
    const parser = new DartParser();
    const deps = parser.parse('pubspec.yaml', 'dependencies:\n  http: 1.2.1');
    expect(deps[0]).toMatchObject({ name: 'http', version: '1.2.1' });
  });

  it('parses csproj', () => {
    const parser = new DotnetParser();
    const deps = parser.parse(
      'app.csproj',
      '<Project><ItemGroup><PackageReference Include="Newtonsoft.Json" Version="13.0.3" /></ItemGroup></Project>'
    );
    expect(deps[0]).toMatchObject({ name: 'Newtonsoft.Json', version: '13.0.3' });
  });
});
