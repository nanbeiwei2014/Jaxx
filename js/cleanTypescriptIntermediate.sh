find . -name "*.ts" | while read line; do
	# v='expr index $line .ts'
	# echo $v
    command_rm_js_from_typescript_id="${line%".ts"}".js
    command_rm_map_from_typescript_id="${line%".ts"}".js.map
	echo "removing js :: $command_rm_js_from_typescript_id"
	echo "removing map :: $command_rm_map_from_typescript_id"
	rm $command_rm_js_from_typescript_id;
	rm $command_rm_map_from_typescript_id;
done