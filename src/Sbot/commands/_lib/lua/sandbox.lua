local blacklisted = {
	"io = nil;",
	"getfenv = nil;"
}
os.execute("lua -e \""..table.concat(blacklisted, " ").." "..arg[1].."\"")