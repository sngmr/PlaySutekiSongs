# A sample Guardfile
# More info at https://github.com/guard/guard#readme

# Add files and commands to this file, like the example:
#   watch(%r{file/path}) { `command(s)` }
#
#guard 'shell' do
#  watch(/(.*).txt/) {|m| `tail #{m[0]}` }
#end

guard :shell do
  watch(/.*/) {
  	`kill $(ps aux | fgrep "ruby: foreman" | fgrep -v "fgrep" | awk '{print $2}')`
  }
end
